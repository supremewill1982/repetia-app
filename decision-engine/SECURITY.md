# Security and deployment boundary

## Core guarantee

The Decision Engine is a decision/governance component. It does not execute external actions, mutate consumer systems, or persist request payloads.

## Required production controls

A production deployment of the HTTP adapter MUST provide:

1. TLS termination and secure transport.
2. Strong client authentication and authorization.
3. Tenant isolation and least-privilege access.
4. Rate limiting and request-size limits.
5. Structured access/error logging without sensitive payload leakage.
6. Secret management outside source control.
7. Monitoring, alerting, and health checks.
8. Backup/recovery procedures for any external audit store.
9. Dependency and container/image vulnerability scanning.
10. A human approval gate in the consuming application for decisions marked `human=true`.

## Trust boundary

The engine output is a governance recommendation/requirement, not permission to bypass consumer controls. A consumer MUST NOT interpret `human=false` as authorization to perform an otherwise restricted operation.

## Data minimization

The built-in audit helper records decision metadata but deliberately does not store the original description or context. Applications that persist full requests must define their own retention, access-control, and privacy policy.

## Reporting

Security issues should be reported privately to the repository maintainers rather than disclosed publicly before a fix is available.
