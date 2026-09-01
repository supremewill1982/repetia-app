# Decision Engine platform status

This file distinguishes what is implemented in-repository from deployment/business actions that require external infrastructure or product decisions.

| Step | Status | Evidence / boundary |
|---|---|---|
| 1. Freeze V9 reference | DONE | V9 adversarial suite remains green |
| 2. Core architecture boundary | DONE | contracts / engine / governance / service separated |
| 3. Reusable package | DONE | `pyproject.toml`, public `decision_engine` API |
| 4. Test battery | DONE | contract, service, API, governance, cross-domain, adversarial tests |
| 5. Second domain | DONE | PME/ERP financial and destructive-data scenarios |
| 6. Multi-agent decision path | DONE | agent selection + execution-neutral governance plan |
| 7. Arbitration path | DONE | arbitration represented in governance plan |
| 8. Human gates | DONE | `human` decision + `human_gate` governance stage |
| 9. Auditability | DONE | structured privacy-conscious audit metadata |
| 10. API boundary | DONE | ASGI `/v1/decide` and `/v1/decide/audited` |
| 11. API security baseline | DONE | production API-key mode + documented deployment controls |
| 12. Tenant boundary | DONE (boundary) | `tenant_id` carried and audited; authorization remains consumer/gateway responsibility |
| 13. Supervision UI | NOT IMPLEMENTED | Requires product/UI scope and deployment data store |
| 14. Connectors | PARTIAL | transport-neutral service/API boundary exists; domain connectors are consumer-specific |
| 15. External AI agents | NOT COUPLED BY DESIGN | engine decides; consumer/orchestrator executes agents |
| 16. SDK | PARTIAL | Python public API exists; dedicated multi-language SDKs not yet needed for V1 |
| 17. Documentation | DONE | README, OpenAPI, SECURITY.md |
| 18. Staging deployment definition | DONE | production container + health check |
| 19. RÉPÉTIA pilot | READY | consumer integration remains to be wired into RÉPÉTIA |
| 20. Non-education pilot | READY | cross-domain regression exists; real external pilot requires a consumer |
| 21. Performance optimization | NOT YET | requires real workload measurements |
| 22. Commercial model | OUTSIDE CODE | requires product/pricing decisions |
| 23. Security review | BASELINE DONE | code/deployment controls documented; independent audit still external |
| 24. V1 release | READY AFTER MAIN CI | release/tag/registry deployment is an external release operation |
| 25. Ecosystem | FUTURE | additional products/connectors follow after V1 |

## Current hard boundaries

The remaining non-code work cannot be safely completed without external infrastructure, credentials, workload data, or product decisions. The repository is deliberately prepared so those integrations do not require changing the V9 classifier core.
