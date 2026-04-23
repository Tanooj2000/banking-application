# User Journeys and Frontend Flows

Last updated: 2026-04-23

## 1) User Sign-Up and Sign-In
Entry:
- `/signup`
- `/signin`

Flow:
1. User enters credentials and profile fields
2. Frontend validates required rules (email/password/name/mobile)
3. Frontend sends auth request to user service
4. On success, token and user context are stored in browser storage
5. User is routed to user dashboard

Failure states:
- Validation errors shown inline/message banner
- API/network errors mapped to human-readable messages

## 2) Admin Sign-Up and Sign-In (Main App)
Entry:
- `/signup`
- `/signin`

Flow:
1. Admin submits registration/login data
2. Frontend validates fields
3. Request sent to admin-related endpoints
4. Admin session object is stored and dashboard opened

Failure states:
- Invalid credentials
- Server/network failure
- Session inconsistency fallback (forced sign-out)

## 3) Account Application Creation
Entry:
- `/createaccount`

Flow:
1. User chooses country and target bank
2. User fills personal/account data
3. User uploads required documents and photo
4. Frontend builds multipart payload
5. Endpoint chosen by country (india/usa/uk)
6. Success/failure feedback shown

Failure states:
- Missing required files
- Backend validation failures
- Connectivity failure to account service

## 4) User Dashboard Operations
Entry:
- `/userpage`

Flow:
1. Auth guard checks session
2. User profile fetched
3. User accounts/documents fetched
4. User can edit profile/password and view/download docs

Failure states:
- Missing/expired token
- Invalid user ID state
- API timeout/network errors

## 5) Admin Dashboard Operations (Main App)
Entry:
- `/adminpage`

Flow:
1. Session guard validates admin session
2. Admin profile hydration if partial profile exists
3. Bank-specific account queue fetched
4. Admin approves/rejects account requests
5. Admin can create bank branch and edit profile/password

Failure states:
- Session expiry marker triggered in storage
- Auth guard logout + redirect
- API request failures on approval/rejection/update

## 6) Root Admin Review Flow
Entry:
- Root-admin app `/` then `/admin/dashboard`

Flow:
1. Root-admin signs in and receives JWT token
2. Pending admin applications fetched
3. Root-admin approves/rejects applications
4. Local decision history updated for quick trace

Failure states:
- 401 auth failure and redirect
- Non-JSON response fallback handling
- Empty queue response
