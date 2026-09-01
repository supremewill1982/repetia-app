from classifier import classify_task

def decide(description, disagreement=False, failed_debate_rounds=0):
    result = classify_task(description)

    if (
        result["debate"]
        and disagreement
        and failed_debate_rounds >= 2
    ):
        result["arbitration"] = True

    return result
