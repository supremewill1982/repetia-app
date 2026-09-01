"""Decision orchestration layer for the reusable Decision Engine."""
try:
    from .classifier_v5 import classify
except ImportError:
    from classifier_v5 import classify


def decide(description, disagreement=False, failed_debate_rounds=0):
    """Classify and govern a task; never execute the requested action."""
    result = classify(description)

    if result["debate"] and disagreement and failed_debate_rounds >= 2:
        result["arbitration"] = True

    return result
