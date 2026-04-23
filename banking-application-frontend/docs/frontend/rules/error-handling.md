# Error Handling Rules (Frontend)

Last updated: 2026-04-23

## Goals
- Show user-friendly messages instead of raw backend payloads
- Differentiate network/auth/validation/server errors
- Handle timeout and retry where safe
- Keep full technical details available in console logs for debugging

## Implemented Patterns
- Typed API error objects in selected API modules
- 30-second timeout for long requests
- Retry with backoff for retriable failures only
- Centralized message extraction utility for mixed error shapes

## User Message Mapping
| Error Type | User Message Style |
|---|---|
| Network unavailable | Service unreachable, check connection |
| Timeout | Request timed out, please retry |
| Authentication (401) | Session expired, sign in again |
| Permission (403) | You do not have permission |
| Validation (400) | Check entered data |
| Not Found (404) | Requested resource unavailable |
| Server errors (5xx) | Server error, try again later |

## Recovery Guidelines
- Auth errors: clear stale session and redirect to sign-in
- Validation errors: keep user on form and highlight actionable fix
- Network/timeout: allow retry and preserve entered form state where possible
- Unknown errors: fallback generic message and keep logs for diagnosis

## Chatbot Error Alignment
Chatbot UI should map service failures to predictable text responses and avoid leaking internal errors. See chatbot add-on failure modes for exact mapping.
