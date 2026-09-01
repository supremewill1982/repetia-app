import unittest

from decision_engine import DecisionRequest, DecisionResponse, evaluate


class PublicApiTests(unittest.TestCase):
    def test_contract_types_are_importable(self):
        self.assertTrue(issubclass(DecisionRequest, object))
        self.assertTrue(issubclass(DecisionResponse, object))

    def test_evaluate_exposes_only_a_decision(self):
        request = DecisionRequest(description="summarize a document")
        response = evaluate(request)
        self.assertIsInstance(response, DecisionResponse)
        self.assertTrue(hasattr(response, "level"))
        self.assertFalse(hasattr(response, "execute"))


if __name__ == "__main__":
    unittest.main()
