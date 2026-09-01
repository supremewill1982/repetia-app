from pathlib import Path
from importlib.util import spec_from_file_location, module_from_spec

BASE = Path(__file__).resolve().parents[1]

spec = spec_from_file_location(
    "engine_v5",
    BASE / "engine-v5.py"
)

module = module_from_spec(spec)
spec.loader.exec_module(module)

decide = module.decide


cases = [

    # --------------------------------------------------------
    # SIMPLES
    # --------------------------------------------------------

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
        "SIMPLE_LABEL",
        "Corriger le libellé d'un bouton.",
        "simple",
        ["coder"],
        False,
        False,
        False
    ),

    # --------------------------------------------------------
    # MOYENS
    # --------------------------------------------------------

    (
        "BUG",
        "Corriger un bug sur l'écran de connexion.",
        "medium",
        ["coder", "reviewer"],
        False,
        False,
        False
    ),

    (
        "FONCTIONNALITE",
        "Ajouter une fonctionnalité de recherche.",
        "medium",
        ["coder", "reviewer"],
        False,
        False,
        False
    ),

    # --------------------------------------------------------
    # COMPLEXES
    # --------------------------------------------------------

    (
        "ARCHITECTURE",
        "Modifier l'architecture de stockage des données sensibles.",
        "complex",
        ["coder", "reviewer"],
        True,
        False,
        False
    ),

    (
        "AUTH",
        "Modifier le système d'authentification.",
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
    ),

    # --------------------------------------------------------
    # INCERTITUDE
    # --------------------------------------------------------

    (
        "INCERTAIN",
        "Corriger un bug difficile à reproduire.",
        "medium",
        ["coder", "reviewer"],
        True,
        False,
        False
    )
]


print("===== MOTEUR DÉCISIONNEL V5 =====")

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

    result = decide(task)

    ok = (
        result["level"] == expected_level
        and result["agents"] == expected_agents
        and result["debate"] == expected_debate
        and result["arbitration"] == expected_arbitration
        and result["human"] == expected_human
    )

    print()
    print(name)
    print("  tâche       :", task)
    print("  difficulté  :", result["difficulty"])
    print("  risque      :", result["risk"])
    print("  niveau      :", result["level"])
    print("  agents      :", ", ".join(result["agents"]))
    print("  incertitude :", result["uncertainty"])
    print("  débat       :", result["debate"])
    print("  arbitre     :", result["arbitration"])
    print("  humain      :", result["human"])
    print("  RESULTAT    :", "PASS" if ok else "FAIL")

    if ok:
        passed += 1


# ============================================================
# ESCALADE
# ============================================================

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
    print("✓ MOTEUR V5 VALIDÉ")
else:
    print("✗ MOTEUR V5 À CORRIGER")
