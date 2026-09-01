import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from classifier import classify_task
from decision import decide

cases = [
    {
        "name": "TEXTE SIMPLE",
        "task": "Corriger une faute de frappe dans le titre.",
        "debate": False
    },
    {
        "name": "BUG MOYEN",
        "task": "Corriger un bug sur l'écran de connexion.",
        "debate": False
    },
    {
        "name": "ARCHITECTURE",
        "task": "Modifier l'architecture de stockage des données sensibles.",
        "debate": True
    },
    {
        "name": "PRODUCTION",
        "task": "Effectuer une migration destructive de la base de données de production.",
        "debate": True
    }
]

passed = 0

print("===== CLASSIFICATION LANGAGE NATUREL =====")

for case in cases:
    result = decide(case["task"])

    ok = result["debate"] == case["debate"]

    print()
    print(case["name"])
    print("  Demande     :", case["task"])
    print("  Difficulté  :", result["difficulty"])
    print("  Risque      :", result["risk"])
    print("  Niveau      :", result["level"])
    print("  Agents      :", ", ".join(result["agents"]))
    print("  Débat       :", result["debate"])
    print("  Arbitre     :", result["arbitration"])
    print("  Humain      :", result["human"])
    print("  RESULTAT    :", "PASS" if ok else "FAIL")

    if ok:
        passed += 1

print()
print("==============================")
print(f"RESULTAT : {passed}/{len(cases)}")

if passed == len(cases):
    print("✓ CLASSIFICATEUR VALIDÉ")
else:
    print("✗ CLASSIFICATEUR À AMÉLIORER")

print()
print("===== TEST D'ESCALADE =====")

task = "Modifier l'architecture de stockage des données sensibles."

r1 = decide(task, disagreement=False, failed_debate_rounds=0)
r2 = decide(task, disagreement=True, failed_debate_rounds=1)
r3 = decide(task, disagreement=True, failed_debate_rounds=2)

print("Accord initial       :", r1["arbitration"])
print("Désaccord tour 1     :", r2["arbitration"])
print("Désaccord tour 2     :", r3["arbitration"])

if not r1["arbitration"] and not r2["arbitration"] and r3["arbitration"]:
    print("✓ ESCALADE VERS ARBITRE VALIDÉE")
else:
    print("✗ ESCALADE À CORRIGER")
