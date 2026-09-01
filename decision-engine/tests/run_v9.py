import importlib.util
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
TEST_FILE = Path(__file__).with_name("test_engine_v9_adversarial.py")

spec = importlib.util.spec_from_file_location("v9", TEST_FILE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

failures = []
for test_id, text, expected_level, expected_debate, expected_human in mod.TESTS:
    result = mod.m.classify(text)
    actual = (result.get("level"), result.get("debate"), result.get("human"))
    expected = (expected_level, expected_debate, expected_human)
    if actual != expected:
        failures.append((test_id, text, expected, actual))

print(f"\nV9 runner: {len(mod.TESTS) - len(failures)}/{len(mod.TESTS)}")
if failures:
    print("FAILURES:")
    for test_id, text, expected, actual in failures:
        print(f"{test_id}: expected={expected} actual={actual} | {text}")
    sys.exit(1)

print("V9 ADVERSARIALE VALIDEE")
