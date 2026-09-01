import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE))

from importlib.util import spec_from_file_location, module_from_spec

spec = spec_from_file_location(
    "engine_v4",
    BASE / "engine-v4.py"
)

engine = module_from_spec(spec)
spec.loader.exec_module(engine)

decide = engine.decide


cases = [
    (
        "SIMPLE",
        "Corriger une faute de frappe dans un titre.",
        "simple",
        ["coder"],
        False,
        False,
        False
    ),
    (
        "MOYEN",
        "Corriger un bug sur l'écran de connexion.",
        "medium",
        ["coder", "reviewer"],
        False,
        False,
        False
    ),
    (
        "SECURITE",
        "Modifier l'architecture de stockage des données sensibles.",
        "complex",
        ["coder", "reviewer"],
        True,
        False,
        False
    ),
    (
        "PRODUCTION",
        "Modifier la base de données et effectuer une migration en production.",
        "complex",
        ["coder", "reviewer"],
        True,
        False,
        True
    )
]


print("===== MOTEUR V4 =====")

passed = 0

for (
    name,
    task,
    expected_level,
    expected_agents,
    expected_debate,
    expected_arbitration,
    expected_human
) in cases:

    r = decide(task)

    ok = (
        r["level"] == expected_level
        and r["agents"] == expected_agents
        and r["debate"] == expected_debate
        and r["arbitration"] == expected_arbitration
        and r["human"] == expected_human
    )

    print()
    print(name)
    print("  difficulté :", r["difficulty"])
    print("  risque     :", r["risk"])
    print("  niveau     :", r["level"])
    print("  agents     :", ", ".join(r["agents"]))
    print("  débat      :", r["debate"])
    print("  arbitre    :", r["arbitration"])
    print("  humain     :", r["human"])
    print("  RESULTAT   :", "PASS" if ok else "FAIL")

    if ok:
        passed += 1


print()
print("===== TEST ESCALADE =====")

task = "Modifier l'architecture de stockage des données sensibles."

r0 = decide(task)
r1 = decide(task, disagreement=True, failed_rounds=1)
r2 = decide(task, disagreement=True, failed_rounds=2)

escalation_ok = (
    r0["arbitration"] is False
    and r1["arbitration"] is False
    and r2["arbitration"] is True
)

print("Sans désaccord :", r0["arbitration"])
print("Après 1 tour   :", r1["arbitration"])
print("Après 2 tours  :", r2["arbitration"])
print("RESULTAT       :", "PASS" if escalation_ok else "FAIL")

if escalation_ok:
    passed += 1

total = len(cases) + 1

print()
print("==============================")
print(f"RESULTAT : {passed}/{total}")

if passed == total:
    print("✓ MOTEUR V4 VALIDÉ")
else:
    print("✗ MOTEUR V4 À CORRIGER")
