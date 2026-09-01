import sys
from pathlib import Path

BASE = Path(__file__).parent
sys.path.insert(0, str(BASE))

from importlib.util import spec_from_file_location, module_from_spec

spec = spec_from_file_location(
    "classifier_v4",
    BASE / "classifier-v4.py"
)

module = module_from_spec(spec)
spec.loader.exec_module(module)

classify = module.classify


def decide(
    task,
    disagreement=False,
    failed_rounds=0
):
    result = classify(task)

    if (
        result["debate"]
        and disagreement
        and failed_rounds >= 2
    ):
        result["arbitration"] = True

    return result
