"""Dependency-free ASGI adapter for the Decision Engine service boundary.

The adapter exposes health and JSON decision endpoints without coupling the
core engine to a web framework. Put authentication, TLS, rate limiting, and
network policy at the deployment gateway for production deployments.
"""
import json
from typing import Any, Callable, Dict, List

from service import evaluate_payload, evaluate_payload_with_audit

MAX_BODY_BYTES = 256 * 1024


def _json_response(status: int, body: Dict[str, Any]) -> List[bytes]:
    return [json.dumps(body, separators=(",", ":"), ensure_ascii=False).encode("utf-8")]


async def application(scope: Dict[str, Any], receive: Callable, send: Callable) -> None:
    if scope.get("type") != "http":
        return

    method = scope.get("method", "GET").upper()
    path = scope.get("path", "/")

    if method == "GET" and path == "/health":
        status, body = 200, {"status": "ok", "service": "decision-engine"}
    elif method == "POST" and path in {"/v1/decide", "/v1/decide/audited"}:
        raw = b""
        while True:
            message = await receive()
            raw += message.get("body", b"")
            if len(raw) > MAX_BODY_BYTES:
                status, body = 413, {"error": "request body too large"}
                break
            if not message.get("more_body", False):
                try:
                    payload = json.loads(raw.decode("utf-8"))
                    if not isinstance(payload, dict):
                        raise ValueError("JSON body must be an object")
                    body = (
                        evaluate_payload_with_audit(payload)
                        if path.endswith("/audited")
                        else evaluate_payload(payload)
                    )
                    status = 200
                except (UnicodeDecodeError, json.JSONDecodeError, TypeError, ValueError) as exc:
                    status, body = 400, {"error": str(exc)}
                break
    else:
        status, body = 404, {"error": "not found"}

    response_body = _json_response(status, body)
    await send({
        "type": "http.response.start",
        "status": status,
        "headers": [
            (b"content-type", b"application/json; charset=utf-8"),
            (b"content-length", str(len(response_body[0])).encode("ascii")),
        ],
    })
    await send({"type": "http.response.body", "body": response_body[0]})


app = application
