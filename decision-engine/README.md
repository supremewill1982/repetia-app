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
- `evaluate_payload(payload)`: transport-neutral JSON-compatible boundary.
- `evaluate_payload_with_audit(payload)`: decision plus structured audit record.

Consumers should depend only on this public API, not legacy classifier filenames or implementation details.

## HTTP/API boundary

A dependency-free ASGI adapter is provided as `decision_engine.asgi:app`.

Endpoints:

- `GET /health` — liveness check.
- `POST /v1/decide` — evaluate a JSON decision request.
- `POST /v1/decide/audited` — evaluate and return the decision plus audit metadata.

Example request:

```json
{"description":"review a report","request_id":"req-001","requester":"client-a"}
```

The adapter intentionally has no authentication or persistence dependency. Production deployments must place it behind an authenticated gateway/service boundary with TLS, rate limiting, logging, network restrictions, and tenant isolation.

## Governance

The engine can require additional agents, debate, arbitration, or human approval. It never performs the requested external action itself.

The current V9 classifier is preserved as the reference classification behavior. The public package boundary is versioned independently so future products can integrate without importing legacy classifier filenames.

## Architecture boundary

```text
Consumer / ERP / RÉPÉTIA / future product
                    |
                    v
             HTTP or Python API
                    |
                    v
             DecisionRequest
                    |
                    v
             Public Engine API
                    |
          +---------+---------+
          |                   |
          v                   v
     V9 classification    audit metadata
          |
          v
      Governance
          |
          v
     DecisionResponse
          |
          v
Consumer decides whether/how to execute
```

## Audit

Audit records contain request identity, requester, engine version, decision level/risk, governance flags, reason, and timestamp. The original request payload is not persisted by the audit helper, reducing accidental capture of sensitive input data.

## Development

```bash
python -m pip install -e .
python -m unittest test_contracts.py test_engine.py test_public_api.py test_audit.py test_service.py test_asgi.py test_cross_domain.py
python tests/run_v9.py
```

To run the ASGI application locally with an ASGI server such as Uvicorn:

```bash
uvicorn decision_engine.asgi:app
```

The ASGI server is an optional deployment dependency and is intentionally not required by the core package.

## Integration rule

Do not import `classifier-v5.py`, `classifier.py`, or other legacy implementation modules from consuming applications. Use only the public API:

```python
from decision_engine import DecisionRequest, DecisionResponse, evaluate
```
