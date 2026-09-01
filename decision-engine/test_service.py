import unittest

from service import evaluate_payload


class ServiceBoundaryTests(unittest.TestCase):
    def test_payload_returns_json_safe_decision(self):
        result = evaluate_payload({"description": "summarize a report"})
        self.assertIsInstance(result, dict)
        self.assertIn("level", result)
        self.assertIn("human", result)
        self.assertNotIn("execute", result)

    def test_payload_rejects_missing_description(self):
        with self.assertRaises(ValueError):
            evaluate_payload({})

    def test_payload_rejects_invalid_debate_rounds(self):
        with self.assertRaises(ValueError):
            evaluate_payload({"description": "review a report", "failed_debate_rounds": -1})


if __name__ == "__main__":
    unittest.main()
