# Chatbot Failure Modes and Recovery

Last updated: 2026-04-23

## Purpose
Define deterministic fallback behavior so chatbot failures are predictable and user-safe.

## Failure Mapping
| Failure Type | Typical Trigger | User-Facing Reply Pattern | Recovery Action |
|---|---|---|---|
| Service offline | health check fails, no response | assistant temporarily unavailable | suggest retry and support path |
| Timeout | long-running response beyond timeout | request taking too long | allow retry with same context |
| Authentication failure | 401 from secured endpoint | sign-in required or session expired | trigger sign-in guidance |
| Permission failure | 403 response | insufficient permission | explain role requirement |
| Validation error | missing/invalid user input | missing or invalid field message | request only missing fields |
| Not found | 404 on target resource | no matching record found | ask to verify identifier |
| Server error | 5xx responses | temporary backend issue | suggest retry later |
| Unknown client error | unclassified exception | unexpected issue occurred | generic fallback + log |

## Recovery Sequence
1. Classify error type.
2. Render safe, non-technical message.
3. Preserve conversation context where possible.
4. Provide one concrete next step.
5. Log technical details for developer debugging.

## Deterministic Fallback Templates
Use these templates consistently for user-facing replies.

| Failure Type | Template |
|---|---|
| Service offline | "The assistant service is temporarily unavailable. Please try again in a moment, or continue from the standard app flow." |
| Timeout | "That request timed out. I can retry once now, or you can try again later." |
| Authentication failure | "Your session has expired. Please sign in again to continue." |
| Permission failure | "I cannot perform that action with your current role permissions." |
| Validation error | "I need a correction before I continue: {fieldHint}." |
| Not found | "I could not find a matching record. Please verify the identifier and try again." |
| Server error | "A backend error occurred. Please retry shortly." |
| Unknown client error | "Something unexpected happened. Please try again." |

## Role-Aware Behavior
| Role | On Permission Failure | On Auth Failure |
|---|---|---|
| Anonymous | Explain sign-in requirement | Offer sign-in route |
| User | Explain user-only scope and deny admin actions | Ask re-login |
| Admin | Deny root-admin operations and explain boundary | Ask re-login |
| Root-admin | Deny out-of-scope user-private data operations | Ask re-login |

## Retry Budget
1. Timeout/transient server errors: at most one automatic retry.
2. 429: no immediate retry; follow backoff guidance.
3. Validation/auth/permission errors: no retry, ask for correction or sign-in.
4. After two failed attempts in same task, suggest manual UI path.

## Escalation Triggers
- Same operation fails twice due to server/transient issues.
- User asks to continue after repeated failures.
- Failure includes potential data inconsistency.

Escalation response pattern:
"I could not complete this safely after retries. Please continue via the page workflow or contact support with timestamp {localTime}."

## Never Do
- Do not expose raw backend payloads to users.
- Do not fabricate successful completion.
- Do not retry non-retriable auth/permission/validation failures repeatedly.
