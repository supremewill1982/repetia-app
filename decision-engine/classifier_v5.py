"""Import-safe alias for the V5 classifier implementation.

The legacy filename ``classifier-v5.py`` is preserved as the reference
implementation. This module provides a normal Python import boundary without
changing classifier behavior.
"""
import importlib.util
from pathlib import Path

_source = Path(__file__).with_name("classifier-v5.py")
_spec = importlib.util.spec_from_file_location("decision_engine_classifier_v5_impl", _source)
if _spec is None or _spec.loader is None:
    raise ImportError(f"Unable to load classifier implementation: {_source}")
_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_module)

classify = _module.classify
