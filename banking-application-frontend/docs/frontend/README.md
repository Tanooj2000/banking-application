# Frontend Documentation Hub

Last updated: 2026-04-23
Scope: Frontend only (main user/admin app + root-admin app)

## Purpose
This hub is the single entry point for frontend architecture, setup, API usage, validation/error behavior, and chatbot enablement guidance.

## Frontend Apps
- `bankingapplication` (main customer/admin experience)
- `root-admin` (root admin sign-in and application approval dashboard)

## Read This First
1. [Architecture](./architecture.md)
2. [Developer Runbook](./runbook/dev-ops.md)
3. [API Reference](./contracts/api-reference.md)
4. [User Journeys](./workflows/user-journeys.md)

## Core Documentation
- [Main App Details](./apps/bankingapplication.md)
- [Root Admin App Details](./apps/root-admin.md)
- [Validation Rules](./rules/validation.md)
- [Error Handling](./rules/error-handling.md)

## Chatbot Add-On (Separate Pack)
This is intentionally separated so teams can use frontend docs without chatbot complexity.

- [Chatbot Add-On Index](./chatbot-addon/README.md)
- [Intents and Tools](./chatbot-addon/intents-and-tools.md)
- [Guardrails](./chatbot-addon/guardrails.md)
- [Failure Modes](./chatbot-addon/failure-modes.md)
- [Evaluation Suite](./chatbot-addon/evaluation-suite.md)

## Maintenance Rule
Any PR that changes UI flow, route behavior, validation, API contracts, or chatbot behavior must update the corresponding document in this folder.
