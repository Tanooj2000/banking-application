# Chatbot Intents and Tooling Map

Last updated: 2026-04-23

## Objective
Translate user conversational intent into deterministic frontend/API operations.

## Intent Matrix
| Intent ID | Intent | Required Inputs | Suggested Action | API/Tool | Notes |
|---|---|---|---|---|---|
| I1 | Check account application status | user identity, account/application reference | fetch relevant account list/status | account service read endpoints | read-only |
| I2 | Help with account opening requirements | country, account type context | return requirement checklist + next step route | static guidance + `/createaccount` path | no write call needed |
| I3 | Find banks by country | country | list available banks | bank API `GET /banks/country/{country}` | read-only |
| I4 | View profile details | authenticated user/admin | fetch current profile | user/admin get-by-id APIs | read-only |
| I5 | Update profile | field values + confirmation | submit update request | user/admin update APIs | write operation, require confirmation |
| I6 | Change password guidance | current/new password inputs | apply password update flow | user/admin password endpoints | sensitive action |
| I7 | Admin reviews account queue | admin auth + bank context | list, approve, reject | account admin endpoints | privileged action |
| I8 | Root-admin approves admin application | root-admin auth + target app ID | approve or reject | root-admin dashboard APIs | highest privilege |

## Tooling Policy
- Read-only intents can execute immediately once required parameters are present.
- Write intents require explicit confirmation before execution.
- Privileged operations must validate role context (`user`, `admin`, `root-admin`) before action.

## Clarification Questions Strategy
When required input is missing, ask only minimal targeted questions:
1. Missing identity context: ask for sign-in/session confirmation.
2. Missing operation target: ask for account/application identifier.
3. Missing write payload data: ask only for missing fields.

## Suggested Response Contract
Each chatbot response for actionable operations should include:
- Intent detected
- Action attempted
- Result summary
- Next best step

## Traceability Matrix (Intent -> Endpoint -> Role -> Test)
| Intent ID | Primary Endpoint(s) | Allowed Role | Confirmation Required | Primary Eval IDs |
|---|---|---|---|---|
| I1 | `GET /api/accounts/user/{userId}` | user | No | E1, E10 |
| I2 | guidance only + route `/createaccount` | anonymous/user | No | E2 |
| I3 | `GET /api/banks/country/{country}` | anonymous/user/admin | No | E2 |
| I4 | `GET /api/user/{id}` or `GET /api/admin/{id}` | user/admin | No | E1 |
| I5 | `PUT /api/user/{id}` or `PUT /api/admin/{id}` | user/admin | Yes | E3, E11 |
| I6 | password update endpoint | user/admin | Yes | E11 |
| I7 | account approve/reject endpoints | admin | Yes | E4, E12 |
| I8 | root-admin approve/reject endpoints | root-admin | Yes | E4, E13 |
