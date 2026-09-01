import unittest

from audit import audit_response
from contracts import DecisionResponse


class AuditTests(unittest.TestCase):
    def test_audit_is_structured_and_timestamped(self):
        response = DecisionResponse(
            difficulty=5, risk=5, level="critical", agents=["multiple"],
            debate=True, arbitration=True, human=True, uncertainty=True,
            reason="human approval required",
        )
        record = audit_response("req-1", response)
        data = record.to_dict()
        self.assertEqual(data["request_id"], "req-1")
        self.assertEqual(data["risk"], 5)
        self.assertTrue(data["human"])
        self.assertTrue(data["timestamp"])


if __name__ == "__main__":
    unittest.main()
