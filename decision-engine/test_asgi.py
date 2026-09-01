import asyncio
import json
import unittest

from asgi import application


class ASGITests(unittest.TestCase):
    def _call(self, method, path, payload=None):
        raw = b"" if payload is None else json.dumps(payload).encode("utf-8")
        messages = [{"type": "http.request", "body": raw, "more_body": False}]
        sent = []

        async def receive():
            return messages.pop(0)

        async def send(message):
            sent.append(message)

        asyncio.run(application({"type": "http", "method": method, "path": path}, receive, send))
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


if __name__ == "__main__":
    unittest.main()
