"""Structured decision audit records."""
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional


@dataclass(frozen=True)
class DecisionAudit:
    request_id: Optional[str]
    engine_version: str
    level: str
    risk: int
    human: bool
    debate: bool
    arbitration: bool
    uncertainty: bool
    timestamp: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def audit_response(request_id: Optional[str], response) -> DecisionAudit:
    return DecisionAudit(
        request_id=request_id,
        engine_version=response.engine_version,
        level=response.level,
        risk=response.risk,
        human=response.human,
        debate=response.debate,
        arbitration=response.arbitration,
        uncertainty=response.uncertainty,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
