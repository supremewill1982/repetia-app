"""Public integration boundary for the reusable Decision Engine."""
from .contracts import DecisionRequest, DecisionResponse
from .classifier_v5 import classify
from .decision import decide


def evaluate(request: DecisionRequest) -> DecisionResponse:
    """Evaluate a request without executing the requested action."""
    result = decide(
        request.description,
        disagreement=request.disagreement,
        failed_debate_rounds=request.failed_debate_rounds,
    )
    reason = (
        "human approval required"
        if result["human"]
        else "debate required"
        if result["debate"]
        else "automatic execution may be considered"
    )
    return DecisionResponse(reason=reason, **result)
