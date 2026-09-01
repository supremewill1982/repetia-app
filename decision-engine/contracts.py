"""Stable public contract for the reusable Decision Engine.

The engine decides; consumers execute. Keep this module dependency-light so
future products can integrate without depending on classifier internals.
"""
from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass(frozen=True)
class DecisionRequest:
    """Input accepted by the Decision Engine."""
    description: str
    context: Dict[str, Any] = field(default_factory=dict)
    disagreement: bool = False
    failed_debate_rounds: int = 0
    requester: Optional[str] = None
    request_id: Optional[str] = None


@dataclass(frozen=True)
class DecisionResponse:
    """Stable decision returned to a consuming application."""
    difficulty: int
    risk: int
    level: str
    agents: list[str]
    debate: bool
    arbitration: bool
    human: bool
    uncertainty: bool
    reason: str
    engine_version: str = "v1"
    classifier_version: str = "v9"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "difficulty": self.difficulty,
            "risk": self.risk,
            "level": self.level,
            "agents": self.agents,
            "debate": self.debate,
            "arbitration": self.arbitration,
            "human": self.human,
            "uncertainty": self.uncertainty,
            "reason": self.reason,
            "engine_version": self.engine_version,
            "classifier_version": self.classifier_version,
        }
