import unittest

from contracts import DecisionRequest, DecisionResponse


class ContractTests(unittest.TestCase):
    def test_request_defaults_are_safe(self):
        request = DecisionRequest(description="review a document")
        self.assertEqual(request.context, {})
        self.assertFalse(request.disagreement)
        self.assertEqual(request.failed_debate_rounds, 0)

    def test_response_serializes_stable_shape(self):
        response = DecisionResponse(
            difficulty=2,
            risk=1,
            level="simple",
            agents=["single"],
            debate=False,
            arbitration=False,
            human=False,
            uncertainty=False,
            reason="automatic execution may be considered",
        )
        data = response.to_dict()
        self.assertEqual(data["level"], "simple")
        self.assertEqual(data["agents"], ["single"])
        self.assertIn("engine_version", data)

    def test_response_is_immutable(self):
        response = DecisionResponse(
            difficulty=1, risk=1, level="simple", agents=[], debate=False,
            arbitration=False, human=False, uncertainty=False, reason="ok"
        )
        with self.assertRaises(AttributeError):
            response.level = "complex"


if __name__ == "__main__":
    unittest.main()
