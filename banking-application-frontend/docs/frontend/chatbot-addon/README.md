# Chatbot Add-On Pack (Separate from Core Frontend Docs)

Last updated: 2026-04-23

This directory is intentionally separate so chatbot setup can be managed as an extension on top of core frontend documentation.

## Purpose
Define exactly how the AI assistant should behave, which APIs it can call, what safety boundaries it must honor, and how to validate quality before release.

## Read Order
1. [Intents and Tools](./intents-and-tools.md)
2. [Guardrails](./guardrails.md)
3. [Failure Modes](./failure-modes.md)
4. [Evaluation Suite](./evaluation-suite.md)

## Scope Boundary
Included:
- Frontend chatbot integration behavior
- Bot action design using existing APIs
- Safety and testing guidance

Not included:
- Backend LLM orchestration internals
- Prompt hosting platform specifics
- Model procurement/vendor operations
