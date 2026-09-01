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
            {"description": "review a report", "request_id": "req-001", "tenant_id": "tenant-a", "requester": "operator-1"}
        )
        self.assertEqual(result["audit"]["request_id"], "req-001")
        self.assertEqual(result["audit"]["tenant_id"], "tenant-a")
        self.assertEqual(result["audit"]["requester"], "operator-1")
        self.assertEqual(result["decision"]["engine_version"], "v1")
        self.assertEqual(result["decision"]["classifier_version"], "v9")

    def test_payload_rejects_missing_description(self):
        with self.assertRaises(ValueError):
            evaluate_payload({})

    def test_payload_rejects_invalid_debate_rounds(self):
        with self.assertRaises(ValueError):
            evaluate_payload({"description": "review a report", "failed_debate_rounds": -1})

    def test_payload_rejects_non_boolean_disagreement(self):
        with self.assertRaises(ValueError):
            evaluate_payload({"description": "review a report", "disagreement": "yes"})

    def test_payload_rejects_oversized_description(self):
        with self.assertRaises(ValueError):
            evaluate_payload({"description": "x" * 20_001})

    def test_payload_rejects_invalid_tenant(self):
        with self.assertRaises(ValueError):
            evaluate_payload({"description": "review a report", "tenant_id": ""})


if __name__ == "__main__":
    unittest.main()
