import asyncio
import json
import os
import unittest
from unittest.mock import patch

from asgi import application


class ASGITests(unittest.TestCase):
    def _call(self, method, path, payload=None, headers=None):
        raw = b"" if payload is None else json.dumps(payload).encode("utf-8")
        messages = [{"type": "http.request", "body": raw, "more_body": False}]
        sent = []

        async def receive():
            return messages.pop(0)

        async def send(message):
            sent.append(message)

        scope = {"type": "http", "method": method, "path": path, "headers": headers or []}
        asyncio.run(application(scope, receive, send))
        return sent

    def test_health(self):
        sent = self._call("GET", "/health")
        self.assertEqual(sent[0]["status"], 200)
        self.assertEqual(json.loads(sent[1]["body"])["status"], "ok")

    def test_decide_endpoint_is_json_and_non_executing(self):
        sent = self._call("POST", "/v1/decide", {"description": "review a report"})
        body = json.loads(sent[1]["body"])
        self.assertEqual(sent[0]["status"], 200)
        self.assertIn("difficulty", body)
        self.assertNotIn("execute", body)

    def test_audited_endpoint(self):
        sent = self._call("POST", "/v1/decide/audited", {"description": "review a report", "request_id": "req-002"})
        body = json.loads(sent[1]["body"])
        self.assertEqual(sent[0]["status"], 200)
        self.assertEqual(body["audit"]["request_id"], "req-002")

    def test_invalid_payload(self):
        sent = self._call("POST", "/v1/decide", {})
        self.assertEqual(sent[0]["status"], 400)

    def test_unknown_route(self):
        sent = self._call("GET", "/missing")
        self.assertEqual(sent[0]["status"], 404)

    def test_production_requires_api_key(self):
        with patch.dict(os.environ, {"DECISION_ENGINE_ENV": "production", "DECISION_ENGINE_API_KEY": "secret"}, clear=False):
            sent = self._call("POST", "/v1/decide", {"description": "review a report"})
            self.assertEqual(sent[0]["status"], 401)

    def test_production_accepts_valid_api_key(self):
        with patch.dict(os.environ, {"DECISION_ENGINE_ENV": "production", "DECISION_ENGINE_API_KEY": "secret"}, clear=False):
            sent = self._call(
                "POST", "/v1/decide", {"description": "review a report"},
                headers=[(b"x-api-key", b"secret")],
            )
            self.assertEqual(sent[0]["status"], 200)


if __name__ == "__main__":
    unittest.main()
