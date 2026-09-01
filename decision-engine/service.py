"""Transport-neutral service boundary for API adapters.

HTTP, queues, and other transports should call this module rather than the
classifier directly. No external action is executed here.
"""
from typing import Any, Mapping

try:
    from .contracts import DecisionRequest
    from .engine import evaluate
except ImportError:
    from contracts import DecisionRequest
    from engine import evaluate


def evaluate_payload(payload: Mapping[str, Any]) -> dict[str, Any]:
    """Validate a transport payload and return a serializable decision."""
    if not isinstance(payload, Mapping):
        raise TypeError("payload must be a mapping")

    description = payload.get("description")
    if not isinstance(description, str) or not description.strip():
        raise ValueError("description must be a non-empty string")

    context = payload.get("context", {})
    if not isinstance(context, Mapping):
        raise ValueError("context must be an object")

    failed_rounds = payload.get("failed_debate_rounds", 0)
    if not isinstance(failed_rounds, int) or isinstance(failed_rounds, bool) or failed_rounds < 0:
        raise ValueError("failed_debate_rounds must be a non-negative integer")

    requester = payload.get("requester")
    request_id = payload.get("request_id")
    if requester is not None and not isinstance(requester, str):
        raise ValueError("requester must be a string or null")
    if request_id is not None and not isinstance(request_id, str):
        raise ValueError("request_id must be a string or null")

    request = DecisionRequest(
        description=description,
        context=dict(context),
        disagreement=bool(payload.get("disagreement", False)),
        failed_debate_rounds=failed_rounds,
        requester=requester,
        request_id=request_id,
    )
    return evaluate(request).to_dict()
