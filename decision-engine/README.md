# Decision Engine

Reusable, policy-driven decision and governance engine for agentic applications.

## Core principle

The engine **decides; it does not execute**. A consuming application submits a `DecisionRequest` and receives a `DecisionResponse` describing the governance path.

```python
from decision_engine import DecisionRequest, evaluate

response = evaluate(DecisionRequest(description="review a document"))
```

The consuming application remains responsible for every external side effect.

## Public API

- `DecisionRequest`: stable input contract.
- `DecisionResponse`: stable output contract.
- `evaluate(request)`: public evaluation entry point.

Consumers should depend only on this public API, not legacy classifier filenames or implementation details.

## Governance

The engine can require additional agents, debate, arbitration, or human approval. It never performs the requested external action itself.

The current V9 classifier is preserved as the reference classification behavior. The public package boundary is versioned independently so future products can integrate without importing legacy classifier filenames.

## Architecture boundary

```text
Consumer application
        |
        v
DecisionRequest
        |
        v
Public Engine API
        |
        +--> V9 classification reference
        +--> governance decisions
        +--> audit record helpers
        |
        v
DecisionResponse
        |
        v
Consumer executes (outside this package)
```

This repository currently contains the reusable decision core. Network transport, authentication, persistence, agent execution, and external side effects belong in integration layers and are intentionally not coupled to the classifier.

## Development

```bash
python -m pip install -e .
python -m unittest test_contracts.py test_engine.py test_public_api.py test_audit.py test_cross_domain.py
python tests/run_v9.py
```

## Integration rule

Do not import `classifier-v5.py`, `classifier.py`, or other legacy implementation modules from consuming applications. Use only:

```python
from decision_engine import DecisionRequest, DecisionResponse, evaluate
```
