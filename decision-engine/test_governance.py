import unittest

from decision_engine import DecisionResponse, plan_governance


class GovernancePlannerTests(unittest.TestCase):
    def test_simple_decision_uses_single_agent(self):
        response = DecisionResponse(
            difficulty=1, risk=1, level="simple", agents=["coder"],
            debate=False, arbitration=False, human=False, uncertainty=False,
            reason="automatic execution may be considered",
        )
        plan = plan_governance(response)
        self.assertEqual(plan.stages, ["single_agent"])
        self.assertFalse(plan.human_gate_required)

    def test_complex_human_decision_preserves_governance_order(self):
        response = DecisionResponse(
            difficulty=8, risk=10, level="complex", agents=["coder", "reviewer"],
            debate=True, arbitration=True, human=True, uncertainty=True,
            reason="human approval required",
        )
        plan = plan_governance(response)
        self.assertEqual(
            plan.stages,
            ["parallel_agents", "debate", "arbitration", "human_gate"],
        )
        self.assertTrue(plan.human_gate_required)

    def test_planner_has_no_execution_capability(self):
        response = DecisionResponse(
            difficulty=4, risk=4, level="medium", agents=["coder", "reviewer"],
            debate=False, arbitration=False, human=False, uncertainty=False,
            reason="automatic execution may be considered",
        )
        plan = plan_governance(response)
        self.assertFalse(hasattr(plan, "execute"))


if __name__ == "__main__":
    unittest.main()
