"""Structured, privacy-conscious decision audit records."""
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional


@dataclass(frozen=True)
class DecisionAudit:
    request_id: Optional[str]
    requester: Optional[str]
    engine_version: str
    classifier_version: str
    level: str
    risk: int
    human: bool
    debate: bool
    arbitration: bool
    uncertainty: bool
    reason: str
    timestamp: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def audit_response(request_id: Optional[str], response, requester: Optional[str] = None) -> DecisionAudit:
    """Create an audit record without persisting the original request payload."""
    return DecisionAudit(
        request_id=request_id,
        requester=requester,
        engine_version=response.engine_version,
        classifier_version=response.classifier_version,
        level=response.level,
        risk=response.risk,
        human=response.human,
        debate=response.debate,
        arbitration=response.arbitration,
        uncertainty=response.uncertainty,
        reason=response.reason,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
