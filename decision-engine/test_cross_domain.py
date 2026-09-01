"""Cross-domain checks proving the public engine is not education-specific."""
import unittest

from decision_engine import DecisionRequest, DecisionResponse, evaluate


class CrossDomainTests(unittest.TestCase):
    def test_business_data_deletion_uses_governance_boundary(self):
        request = DecisionRequest(
            description="supprimer définitivement toutes les factures impayées d'un ERP PME"
        )
        response = evaluate(request)

        self.assertIsInstance(response, DecisionResponse)
        self.assertTrue(response.human)
        self.assertGreaterEqual(response.risk, 4)
        self.assertFalse(hasattr(response, "execute"))

    def test_business_financial_review_is_not_hardcoded_to_education(self):
        request = DecisionRequest(
            description="review a monthly cash-flow report and summarize anomalies"
        )
        response = evaluate(request)

        self.assertIsInstance(response, DecisionResponse)
        self.assertFalse(hasattr(response, "execute"))
        self.assertIn(response.level, {"simple", "medium", "complex"})


if __name__ == "__main__":
    unittest.main()
