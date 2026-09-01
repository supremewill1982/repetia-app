"""Transport-neutral service boundary for API adapters.

HTTP, queues, and other transports should call this module rather than the
classifier directly. No external action is executed here.
"""
from typing import Any, Mapping

try:
    from .audit import audit_response
    from .contracts import DecisionRequest
    from .engine import evaluate
except ImportError:
    from audit import audit_response
    from contracts import DecisionRequest
    from engine import evaluate

MAX_DESCRIPTION_LENGTH = 20_000
MAX_REQUESTER_LENGTH = 256
MAX_REQUEST_ID_LENGTH = 256


def _request_from_payload(payload: Mapping[str, Any]) -> DecisionRequest:
    if not isinstance(payload, Mapping):
        raise TypeError("payload must be a mapping")

    description = payload.get("description")
    if not isinstance(description, str) or not description.strip():
        raise ValueError("description must be a non-empty string")
    if len(description) > MAX_DESCRIPTION_LENGTH:
        raise ValueError("description exceeds the maximum length")

    context = payload.get("context", {})
    if not isinstance(context, Mapping):
        raise ValueError("context must be an object")

    disagreement = payload.get("disagreement", False)
    if not isinstance(disagreement, bool):
        raise ValueError("disagreement must be a boolean")

    failed_rounds = payload.get("failed_debate_rounds", 0)
    if not isinstance(failed_rounds, int) or isinstance(failed_rounds, bool) or failed_rounds < 0:
        raise ValueError("failed_debate_rounds must be a non-negative integer")

    requester = payload.get("requester")
    request_id = payload.get("request_id")
    if requester is not None and (not isinstance(requester, str) or len(requester) > MAX_REQUESTER_LENGTH):
        raise ValueError("requester must be a string or null within the maximum length")
    if request_id is not None and (not isinstance(request_id, str) or len(request_id) > MAX_REQUEST_ID_LENGTH):
        raise ValueError("request_id must be a string or null within the maximum length")

    return DecisionRequest(
        description=description,
        context=dict(context),
        disagreement=disagreement,
        failed_debate_rounds=failed_rounds,
        requester=requester,
        request_id=request_id,
    )


def evaluate_payload(payload: Mapping[str, Any]) -> dict[str, Any]:
    """Validate a transport payload and return a serializable decision."""
    return evaluate(_request_from_payload(payload)).to_dict()


def evaluate_payload_with_audit(payload: Mapping[str, Any]) -> dict[str, Any]:
    """Evaluate a payload and return the decision together with its audit record."""
    request = _request_from_payload(payload)
    response = evaluate(request)
    return {
        "decision": response.to_dict(),
        "audit": audit_response(request.request_id, response, request.requester).to_dict(),
    }
