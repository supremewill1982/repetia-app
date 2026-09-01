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

- `DecisionRequest`: stable input contract, including optional `tenant_id`, `requester`, and `request_id` identity fields.
- `DecisionResponse`: stable output contract.
- `evaluate(request)`: public evaluation entry point.
- `evaluate_payload(payload)`: transport-neutral JSON-compatible boundary.
- `evaluate_payload_with_audit(payload)`: decision plus structured audit record.
- `plan_governance(response)`: execution-neutral plan for agents, debate, arbitration and human gate.

Consumers should depend only on this public API, not legacy classifier filenames or implementation details.

## HTTP/API boundary

A dependency-free ASGI adapter is provided as `decision_engine.asgi:app`.

Endpoints:

- `GET /health` — liveness check.
- `POST /v1/decide` — evaluate a JSON decision request.
- `POST /v1/decide/audited` — evaluate and return the decision plus audit metadata.

In production mode (`DECISION_ENGINE_ENV=production`), the API requires `X-API-Key` matching `DECISION_ENGINE_API_KEY`. TLS, rate limiting, network controls, and tenant authorization remain deployment responsibilities.

`tenant_id` is an identity/isolation boundary carried through the request and audit metadata. It does not itself grant authorization; the consuming gateway/application must authenticate the caller and enforce that the caller can access the requested tenant.

## Container

Build and run the production container:

```bash
docker build -t decision-engine .
docker run --rm -p 8000:8000 \
  -e DECISION_ENGINE_ENV=production \
  -e DECISION_ENGINE_API_KEY='replace-with-a-secret' \
  decision-engine
```

The image runs as a non-root user and exposes `/health` for container health checks.

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
             (tenant/request identity)
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

Audit records contain request identity, requester, tenant identity, engine version, classifier version, decision level/risk, governance flags, reason, and timestamp. The original request payload is not persisted by the audit helper, reducing accidental capture of sensitive input data.

## Development

```bash
python -m pip install -e .
python -m unittest test_contracts.py test_engine.py test_public_api.py test_audit.py test_service.py test_asgi.py test_openapi.py test_governance.py test_cross_domain.py
python tests/run_v9.py
```

To run the ASGI application locally with Uvicorn:

```bash
python -m pip install -e '.[server]'
uvicorn decision_engine.asgi:app
```

## Integration rule

Do not import `classifier-v5.py`, `classifier.py`, or other legacy implementation modules from consuming applications. Use only the public API:

```python
from decision_engine import DecisionRequest, DecisionResponse, evaluate, plan_governance
```
