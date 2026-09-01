import unittest

from service import evaluate_payload, evaluate_payload_with_audit


class ServiceBoundaryTests(unittest.TestCase):
    def test_payload_returns_json_safe_decision(self):
        result = evaluate_payload({"description": "summarize a report"})
        self.assertIsInstance(result, dict)
        self.assertIn("level", result)
        self.assertIn("human", result)
        self.assertNotIn("execute", result)

    def test_payload_returns_decision_and_audit(self):
        result = evaluate_payload_with_audit(
            {"description": "review a report", "request_id": "req-001"}
        )
        self.assertEqual(result["audit"]["request_id"], "req-001")
        self.assertEqual(result["decision"]["engine_version"], "v1")

    def test_payload_rejects_missing_description(self):
        with self.assertRaises(ValueError):
            evaluate_payload({})

    def test_payload_rejects_invalid_debate_rounds(self):
        with self.assertRaises(ValueError):
            evaluate_payload({"description": "review a report", "failed_debate_rounds": -1})


if __name__ == "__main__":
    unittest.main()
