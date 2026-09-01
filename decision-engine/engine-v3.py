import json
from pathlib import Path

BASE = Path(__file__).parent

cases = json.loads(
    (BASE / "test-cases-v3.json").read_text()
)

def classify(task):
    text = task.lower()

    risk = 1
    difficulty = 1

    high_risk = [
        ("production", 10),
        ("destructive", 10),
        ("destructive", 10),
        ("données sensibles", 9),
        ("migration", 8),
        ("authentification", 7),
        ("sécurité", 7),
        ("base de données", 7),
        ("paiement", 8),
    ]

    complex_terms = [
        "architecture",
        "migration",
        "authentification",
        "sécurité",
        "base de données",
        "données sensibles",
        "production",
        "paiement",
    ]

    medium_terms = [
        "bug",
        "corriger",
        "fonctionnalité",
        "écran",
        "connexion",
        "navigation",
        "formulaire",
        "test",
    ]

    for term, value in high_risk:
        if term in text:
            risk = max(risk, value)

    for term in complex_terms:
        if term in text:
            difficulty += 2

    for term in medium_terms:
        if term in text:
            difficulty += 1

    if risk >= 7:
        difficulty = max(difficulty, 7)

    if difficulty <= 3:
        level = "simple"
    elif difficulty <= 6:
        level = "medium"
    else:
        level = "complex"

    # MATRICE DE DÉCISION
    if level == "simple" and risk < 5:
        agents = ["coder"]
    else:
        agents = ["coder", "reviewer"]

    debate = (
        level == "complex"
        or risk >= 7
    )

    human = risk >= 10

    return {
        "difficulty": min(difficulty, 10),
        "risk": risk,
        "level": level,
        "agents": agents,
        "debate": debate,
        "arbitration": False,
        "human": human
    }


def decide(task, disagreement=False, failed_rounds=0):
    result = classify(task)

    if (
        result["debate"]
        and disagreement
        and failed_rounds >= 2
    ):
        result["arbitration"] = True

    return result


print("===== MOTEUR DÉCISIONNEL V3 =====")

passed = 0

for case in cases:
    result = decide(case["task"])

    ok = (
        result["level"] == case["expected_level"]
        and result["agents"] == case["expected_agents"]
        and result["debate"] == case["expected_debate"]
        and result["arbitration"] == False
        and result["human"] == case["expected_human"]
    )

    print()
    print(case["name"])
    print("  Difficulté :", result["difficulty"])
    print("  Risque     :", result["risk"])
    print("  Niveau     :", result["level"])
    print("  Agents     :", ", ".join(result["agents"]))
    print("  Débat      :", result["debate"])
    print("  Arbitre    :", result["arbitration"])
    print("  Humain     :", result["human"])
    print("  RESULTAT   :", "PASS" if ok else "FAIL")

    if ok:
        passed += 1

print()
print("==============================")
print(f"RESULTAT : {passed}/{len(cases)}")

if passed == len(cases):
    print("✓ MOTEUR V3 VALIDÉ")
else:
    print("✗ MOTEUR V3 À CORRIGER")
