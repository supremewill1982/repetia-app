# Decision Engine

Reusable, policy-driven decision and governance engine for agentic applications.

## Boundary

The engine **decides; it does not execute**. A consuming application submits a `DecisionRequest` and receives a `DecisionResponse` describing the governance path.

```python
from decision_engine import DecisionRequest, evaluate

response = evaluate(DecisionRequest(description="review a document"))
```

## Public API

- `DecisionRequest`: stable input contract.
- `DecisionResponse`: stable output contract.
- `evaluate(request)`: public evaluation entry point.

Consumers should depend only on this public API, not legacy classifier filenames or implementation details.

## Governance

The engine can require additional agents, debate, arbitration, or human approval. It never performs the requested external action itself.

## Compatibility

V9 remains the reference classification behavior. The package boundary is versioned independently so future products can integrate without importing legacy classifier filenames.

## Development

```bash
python -m pip install -e .
python -m unittest test_contracts.py test_engine.py test_public_api.py
python tests/run_v9.py
```
