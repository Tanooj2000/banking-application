# Frontend Developer Runbook

Last updated: 2026-04-23

## Prerequisites
- Node.js and npm installed
- Java backend microservices running on expected local ports
- Browser with local storage/session storage enabled

## Local Start Commands
### Main app (`bankingapplication`)
1. `cd banking-application-frontend/bankingapplication`
2. `npm install`
3. `npm run dev`

### Root-admin app (`root-admin`)
1. `cd banking-application-frontend/root-admin`
2. `npm install`
3. `npm run dev`

## Build and Preview
### Main app
- `npm run build`
- `npm run preview`

### Root-admin
- `npm run build`
- `npm run preview`
- `npm run lint`

## Backend Port Expectations
- User: `8081`
- Bank: `8082`
- Admin: `8083`
- Root-admin auth: `8084`
- Account: `8085`
- Chatbot: `8086`

## Common Issues and Quick Fixes
1. Symptom: `Failed to fetch` across pages
- Check backend service process and URL/port alignment

2. Symptom: instant redirect to sign-in
- Check token/session keys in browser storage
- Verify token expiry logic and service auth responses

3. Symptom: account create fails with file errors
- Verify all required files are attached in form
- Ensure multipart payload reaches account service endpoint

4. Symptom: chatbot says unavailable
- Check chatbot service health endpoint and auth token availability

## Documentation Update Policy
Update docs in `docs/frontend/` whenever routes, API payloads, auth behavior, validation rules, or chatbot operation changes.
