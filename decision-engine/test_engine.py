import unittest
from unittest.mock import patch

from contracts import DecisionRequest, DecisionResponse
from engine import evaluate


class EngineBoundaryTests(unittest.TestCase):
    def test_evaluate_returns_response_and_never_executes(self):
        request = DecisionRequest(description="build a report")
        fake_result = {
            "difficulty": 2,
            "risk": 1,
            "level": "simple",
            "agents": ["single"],
            "debate": False,
            "arbitration": False,
            "human": False,
            "uncertainty": False,
        }
        with patch("engine.decide", return_value=fake_result):
            response = evaluate(request)

        self.assertIsInstance(response, DecisionResponse)
        self.assertFalse(response.human)
        self.assertFalse(response.debate)
        self.assertIn("automatic", response.reason)

    def test_evaluate_preserves_governance_decision(self):
        request = DecisionRequest(
            description="perform a high-risk irreversible action",
            disagreement=True,
            failed_debate_rounds=2,
        )
        fake_result = {
            "difficulty": 5,
            "risk": 5,
            "level": "critical",
            "agents": ["multiple"],
            "debate": True,
            "arbitration": True,
            "human": True,
            "uncertainty": True,
        }
        with patch("engine.decide", return_value=fake_result):
            response = evaluate(request)

        self.assertTrue(response.debate)
        self.assertTrue(response.arbitration)
        self.assertTrue(response.human)
        self.assertEqual(response.reason, "human approval required")


if __name__ == "__main__":
    unittest.main()
