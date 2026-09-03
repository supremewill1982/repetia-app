"""Public integration boundary for the reusable Decision Engine."""
try:
    from .contracts import DecisionRequest, DecisionResponse
    from .decision import decide
except ImportError:
    from contracts import DecisionRequest, DecisionResponse
    from decision import decide


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
