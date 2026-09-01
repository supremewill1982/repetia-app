from pathlib import Path
from importlib.util import spec_from_file_location, module_from_spec

BASE = Path(__file__).parent

spec = spec_from_file_location(
    "classifier_v5",
    BASE / "classifier-v5.py"
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

    # L'arbitre n'intervient JAMAIS spontanément.
    # Il faut :
    # 1. un débat réellement nécessaire
    # 2. un désaccord
    # 3. deux tours infructueux

    if (
        result["debate"]
        and disagreement
        and failed_rounds >= 2
    ):
        result["arbitration"] = True

    return result
