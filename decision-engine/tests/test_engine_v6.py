import json
from pathlib import Path
from importlib.util import spec_from_file_location, module_from_spec

BASE = Path(__file__).resolve().parents[1]

# Charger le moteur V5 sans le modifier.
spec = spec_from_file_location(
    "engine_v5",
    BASE / "engine-v5.py"
)
module = module_from_spec(spec)
spec.loader.exec_module(module)

decide = module.decide

cases = json.loads(
    (BASE / "test-cases-v6.json").read_text()
)

passed = 0
failed = []
false_positives = []
false_negatives = []

print("===== VALIDATION MASSIVE V6 =====")

for case in cases:
    result = decide(case["task"])

    level_ok = result["level"] == case["expected_level"]
    debate_ok = result["debate"] == case["expected_debate"]
    human_ok = result["human"] == case["expected_human"]

    ok = level_ok and debate_ok and human_ok

    if ok:
        passed += 1
    else:
        failed.append(case["id"])

        if result["debate"] and not case["expected_debate"]:
            false_positives.append(case["id"])

        if not result["debate"] and case["expected_debate"]:
            false_negatives.append(case["id"])

    print(
        f'{case["id"]:>4} | '
        f'{result["level"]:<7} | '
        f'débat={str(result["debate"]):<5} | '
        f'humain={str(result["human"]):<5} | '
        f'{"PASS" if ok else "FAIL"} | '
        f'{case["task"]}'
    )

print()
print("===== DIAGNOSTIC =====")
print("Scénarios :", len(cases))
print("Réussis   :", passed)
print("Échecs    :", len(failed))
print("Faux positifs :", len(false_positives), false_positives)
print("Faux négatifs :", len(false_negatives), false_negatives)

print()
print("==============================")
print(f"RESULTAT : {passed}/{len(cases)}")

if passed == len(cases):
    print("✓ ROBUSTESSE V6 VALIDÉE")
else:
    print("✗ V6 À ANALYSER")
