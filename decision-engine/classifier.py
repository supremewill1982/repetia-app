"""Compatibility layer for the V9 classifier."""

from classifier_v5 import classify


def classify_task(description: str):
    return classify(description)
