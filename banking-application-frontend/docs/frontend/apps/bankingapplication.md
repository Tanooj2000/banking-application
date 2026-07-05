# Main App: bankingapplication

Last updated: 2026-04-23

## Stack
- React 19 + Vite
- Routing: `react-router-dom`
- HTTP: `fetch` and `axios`
- Icons/UI libs: Font Awesome, React Icons, React Select

## Functional Scope
- Public pages: Home, About
- Authentication: user/admin sign-in and sign-up
- User area:
  - Profile read/update
  - Password change
  - View own bank accounts and documents
- Admin area:
  - Profile read/update
  - Password change
  - Review and approve/reject account applications for admin's bank
  - Branch creation
- Account opening flow:
  - Country-aware account create endpoint
  - Multipart upload for proofs and image
- Chatbot:
  - Floating action button and modal chat panel
  - Health check + message send + quick replies

## Major Screens and Responsibility
- `SignIn`: user/admin authentication entry
- `SignUp`: user/admin onboarding
- `BrowseBank`: discover banks by country and metadata
- `CreateAccount`: account application with document upload
- `UserPage`: profile, account listing, document actions
- `AdminPage`: profile, bank account review queue, branch operations

## Auth and Session Notes
- User token and profile are stored in `localStorage`
- Admin session data is stored in `sessionStorage` for main app admin flow
- Logout attempts backend token invalidation for user flow
- Auth guard performs redirect and no-cache behavior to reduce stale page/session issues

## Chatbot Integration Point
- Chatbot appears through `ChatBotButton` component in user/admin pages
- Calls chatbot API wrapper with user ID/session ID/context/auth token
- Fallback user messages are provided when service is unavailable
