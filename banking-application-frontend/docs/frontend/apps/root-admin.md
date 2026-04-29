# Root Admin App: root-admin

Last updated: 2026-04-23

## Stack
- React 19 + Vite
- Routing: `react-router-dom`
- HTTP: `fetch`

## Functional Scope
- Root-admin authentication
- Pending admin application review queue
- Approve/reject operations
- Local decision history persistence and basic insights
- Theme toggle and dashboard sections

## Route Map
- `/`: root-admin sign-in
- `/admin/dashboard`: root-admin dashboard

## Key API Behaviors
- Root-auth endpoint base: `http://localhost:8084/api/root`
- Dashboard action endpoint base: `http://localhost:8083/api/admin/applications`
- Uses JWT token from `localStorage` (`adminToken`) for protected requests

## Operational Notes
- If token is missing/expired, API service signs out and redirects
- Dashboard keeps local action history in browser storage for quick visibility
- Approval and rejection are currently POST-based action endpoints

## Boundary Relative to Main App
- This app is independent and should be deployed/operated as a dedicated root-admin portal
- Root-admin concerns do not mix with end-user or regular admin UI routes
