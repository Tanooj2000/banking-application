# Frontend API Reference (Current Frontend Contracts)

Last updated: 2026-04-23

This document captures the API usage as implemented in frontend code today. It is a frontend contract reference, not an authoritative backend OpenAPI spec.

## Service Base URLs
- User service: `http://localhost:8081/api/user`
- Bank service: `http://localhost:8082/api`
- Admin service: `http://localhost:8083/api/admin`
- Root-auth service: `http://localhost:8084/api/root`
- Account service: `http://localhost:8085/api/accounts`
- Chatbot service: `http://localhost:8086/api/v1/chatbot`

## Main App Auth APIs
### User/Auth
- `POST /register` (user signup)
- `POST /login` (user signin)
- `POST /admins` (admin creation via user API module)
- `POST /logout` (token invalidation request)

Example: user register
```http
POST /api/user/register
Content-Type: application/json

{
	"username": "johndoe",
	"email": "johndoe@gmail.com",
	"password": "BankApp@123",
	"phonenumber": "9876543210"
}
```

Typical success (text/plain):
```json
"User registered successfully"
```

Example: user login
```http
POST /api/user/login
Content-Type: application/json

{
	"usernameOrEmail": "johndoe@gmail.com",
	"password": "BankApp@123"
}
```

Typical success (application/json):
```json
{
	"token": "<jwt-token>",
	"user": {
		"id": 101,
		"username": "johndoe",
		"email": "johndoe@gmail.com"
	}
}
```

Example: user logout
```http
POST /api/user/logout
Authorization: Bearer <jwt-token>
```

Typical success:
```json
{
	"message": "Logged out successfully"
}
```

### Admin/Auth in adminApi module
- `POST /register`
- `POST /login`
- `GET /{adminId}`
- `PUT /{adminId}`
- Password change endpoint used by admin password utility functions in the module

Example: admin register
```http
POST /api/admin/register
Content-Type: application/json

{
	"username": "adminuser",
	"email": "adminuser@gmail.com",
	"password": "BankApp@123",
	"bankname": "Axis Bank",
	"country": "India"
}
```

Example: admin login
```http
POST /api/admin/login
Content-Type: application/json

{
	"usernameOrEmail": "adminuser@gmail.com",
	"password": "BankApp@123"
}
```

Typical success shape (normalized by frontend):
```json
{
	"adminId": 12,
	"username": "adminuser",
	"email": "adminuser@gmail.com",
	"bankname": "Axis Bank",
	"country": "India"
}
```

Example: update admin profile
```http
PUT /api/admin/12
Content-Type: application/json

{
	"username": "adminuser",
	"email": "adminuser@gmail.com"
}
```

## Bank APIs
- `GET /banks/country/{country}`
- `GET /banks/{bankId}`
- `POST /banks/add` (create branch)

Example: fetch banks by country
```http
GET /api/banks/country/India
```

Typical success:
```json
[
	{
		"bankId": 1,
		"bankName": "Axis Bank",
		"city": "Pune",
		"country": "India"
	}
]
```

Example: create branch
```http
POST /api/banks/add
Content-Type: application/json

{
	"country": "India",
	"city": "Pune",
	"bankName": "Axis Bank",
	"branch": "Kothrud",
	"branchCode": "AXISPUN001"
}
```

## Account APIs
- `GET /user/{userId}` (user accounts)
- `POST /create/{countryEndpoint}` where `countryEndpoint` in `india|usa|uk`
- `GET /bank/{bank}` (admin account queue by bank)
- `POST /approve/{accountId}`
- `POST /reject/{accountId}`
- `GET /documents/{documentId}/view`
- `GET /documents/{documentId}/download`
- `GET /user/{userId}/documents`
- `GET /account/{accountNumber}/documents`

Example: get user accounts
```http
GET /api/accounts/user/101
```

Typical success:
```json
[
	{
		"id": 4001,
		"accountNumber": "1234567890",
		"status": "PENDING",
		"bankName": "Axis Bank",
		"country": "India"
	}
]
```

Example: create account (multipart)
```http
POST /api/accounts/create/india
Content-Type: multipart/form-data

fullName=John%20Doe
email=johndoe@gmail.com
mobile=9876543210
country=India
bankName=Axis%20Bank
idProof=<file>
addressProof=<file>
incomeProof=<file>
photo=<file>
```

Typical success:
```json
{
	"message": "Account application created successfully",
	"applicationId": 4001,
	"status": "PENDING"
}
```

Example: approve account
```http
POST /api/accounts/approve/4001
```

Typical success:
```json
{
	"success": true,
	"message": "Account approved successfully"
}
```

Example: reject account
```http
POST /api/accounts/reject/4001
```

Typical success:
```json
{
	"success": true,
	"message": "Account rejected successfully"
}
```

## Root-Admin APIs
### Authentication (`root-admin` app)
- `POST /signin`

Example: root-admin signin
```http
POST /api/root/signin
Content-Type: application/json

{
	"username": "rootadmin",
	"password": "rootpass"
}
```

Typical success:
```json
{
	"success": true,
	"message": "Sign in successful",
	"token": "<jwt-token>"
}
```

### Dashboard actions (`root-admin` app)
- `GET /api/admin/applications/pending`
- `POST /api/admin/applications/{adminId}/approve`
- `POST /api/admin/applications/{adminId}/reject`
- `GET /api/admin/applications/{applicationId}`
- `GET /api/admin/applications/stats`

Example: get pending applications
```http
GET /api/admin/applications/pending
Authorization: Bearer <admin-token>
```

Typical success:
```json
[
	{
		"id": 2001,
		"username": "candidateAdmin",
		"email": "candidate@gmail.com",
		"bankname": "Axis Bank",
		"country": "India",
		"status": "PENDING"
	}
]
```

Example: approve admin application
```http
POST /api/admin/applications/2001/approve
Authorization: Bearer <admin-token>
Content-Type: application/json

{
	"rootUsername": "rootadmin",
	"rootPassword": "rootpass",
	"reason": "Application meets all requirements"
}
```

Example: reject admin application
```http
POST /api/admin/applications/2001/reject
Authorization: Bearer <admin-token>
Content-Type: application/json

{
	"rootUsername": "rootadmin",
	"rootPassword": "rootpass",
	"reason": "Missing required details"
}
```

## Chatbot APIs (Main App)
- `POST /chat`
- `GET /health`
- `GET /capabilities`

Example: send chatbot message
```http
POST /api/v1/chatbot/chat
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
	"message": "Show my account status",
	"userId": "101",
	"sessionId": "session_1713871000000_abcd12345",
	"context": "banking-app",
	"authToken": "<jwt-token>"
}
```

Typical success shape used by frontend:
```json
{
	"success": true,
	"data": {
		"response": "Your latest account application is in pending status.",
		"quickReplies": [
			"Track application",
			"What documents are required?"
		],
		"messageId": "msg_123"
	}
}
```

Example: chatbot health
```http
GET /api/v1/chatbot/health
```

Example: chatbot capabilities
```http
GET /api/v1/chatbot/capabilities
```

## Token and Auth Header Behavior
- Main app user auth token key: `authToken` (Bearer header injected in relevant modules)
- Root-admin auth token key: `adminToken`
- Chatbot API adds Bearer token automatically when `authToken` exists

## Timeout and Retry Notes
- Several API wrappers enforce ~30s timeout using `AbortController` or axios timeout
- Retry with exponential backoff is used in selected API modules
- Validation/auth/permission errors are typically non-retriable

## Standard Error Contract (Chatbot-Oriented)
The frontend currently handles multiple backend error shapes. For chatbot reliability, normalize responses into one internal envelope before generating user-facing messages.

Preferred normalized envelope:
```json
{
	"httpStatus": 401,
	"errorType": "AUTH_ERROR",
	"userMessage": "Your session has expired. Please sign in again.",
	"technicalMessage": "JWT token expired",
	"traceId": "optional-correlation-id",
	"retryable": false
}
```

Observed backend error variants to normalize:
```json
{
	"message": "Email already exists"
}
```

```json
{
	"error": "Bad Request",
	"message": "Validation failed"
}
```

```json
{
	"errorMessage": "Internal processing failure"
}
```

Plain text variant:
```text
Failed to approve application
```

## HTTP Status to Chatbot Fallback Mapping
| HTTP Status | Internal Error Type | Chatbot Reply Template | Retry Policy | Escalation |
|---|---|---|---|---|
| 400 | VALIDATION_ERROR | "I need a few corrections before I can continue: {fieldHint}." | No auto-retry | Ask for missing/invalid field |
| 401 | AUTH_ERROR | "Your session expired. Please sign in again, then I can continue." | No auto-retry | Redirect/sign-in guidance |
| 403 | PERMISSION_ERROR | "I do not have permission to do that for your current role." | No auto-retry | Explain role boundary |
| 404 | NOT_FOUND | "I could not find that record. Please verify the identifier." | No auto-retry | Ask for identifier again |
| 408 | TIMEOUT_ERROR | "That request timed out. I can retry once if you want." | One retry max | Offer manual retry |
| 409 | CONFLICT_ERROR | "That action conflicts with current state. I can refresh and try again." | One retry after refresh | Suggest refresh |
| 422 | VALIDATION_ERROR | "Some inputs do not match required format: {fieldHint}." | No auto-retry | Ask corrected input |
| 429 | RATE_LIMIT | "Too many requests right now. Please wait a moment and retry." | Retry after backoff | Show wait guidance |
| 500/502/503/504 | SERVER_ERROR | "A server issue occurred. Please try again shortly." | Retry once for 502/503/504 | Escalate to support if repeated |

## Retry and Escalation Policy
1. Never auto-retry for 400, 401, 403, 404, 422.
2. Allow at most one automatic retry for timeout/transient server errors.
3. For repeated transient failure in same conversation, stop retrying and provide manual path.
4. Always preserve intent context when asking user to retry.

## Contract Change Management
When endpoint payloads or error formats change:
1. Update this API reference.
2. Update chatbot failure mapping in `chatbot-addon/failure-modes.md`.
3. Update affected evaluation tests in `chatbot-addon/evaluation-suite.md`.
4. Mark impacted intent rows in `chatbot-addon/intents-and-tools.md`.
