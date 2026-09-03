"""Pure governance planning derived from a DecisionResponse.

This module describes what a consuming orchestrator should do next. It never
creates agents, calls models, executes tools, or performs external actions.
"""
from dataclasses import dataclass
from typing import List


@dataclass(frozen=True)
class GovernancePlan:
    stages: List[str]
    human_gate_required: bool

    def to_dict(self) -> dict[str, object]:
        return {
            "stages": list(self.stages),
            "human_gate_required": self.human_gate_required,
        }


def plan_governance(response) -> GovernancePlan:
    """Translate a decision into an execution-neutral governance plan."""
    if len(response.agents) <= 1:
        stages = ["single_agent"]
    else:
        stages = ["parallel_agents"]

    if response.debate:
        stages.append("debate")
    if response.arbitration:
        stages.append("arbitration")
    if response.human:
        stages.append("human_gate")

    return GovernancePlan(stages=stages, human_gate_required=response.human)
