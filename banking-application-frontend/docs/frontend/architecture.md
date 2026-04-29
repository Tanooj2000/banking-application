# Frontend Architecture

Last updated: 2026-04-23

## Overview
The frontend is split into two React + Vite applications:

1. `bankingapplication`
- User and admin-facing banking UI
- Includes signup/signin, browse banks, account creation, profile management, admin operations, and chatbot UI

2. `root-admin`
- Separate portal for root admin authentication and admin application decisioning

## Runtime Topology
- Main app (Vite): local dev server, browser SPA routing
- Root-admin app (Vite): local dev server, browser SPA routing
- Backend dependencies:
  - User service: `http://localhost:8081`
  - Bank service: `http://localhost:8082`
  - Admin service: `http://localhost:8083`
  - Root-admin service: `http://localhost:8084`
  - Account service: `http://localhost:8085`
  - Chatbot service: `http://localhost:8086`

## Main App Route Map (`bankingapplication`)
- `/` -> Home page
- `/about` -> About page
- `/signin` -> Unified sign-in page
- `/signup` -> Unified sign-up page
- `/browsebank` -> Bank browsing/filtering
- `/userpage` -> User dashboard/profile/accounts
- `/adminpage` -> Admin dashboard/profile/review operations
- `/createaccount` -> New bank account application flow

## Root-Admin Route Map (`root-admin`)
- `/` -> Root-admin sign-in page
- `/admin/dashboard` -> Root-admin operations dashboard

## State and Session Model
Main app:
- User auth uses `localStorage` token (`authToken`) plus `currentUser` and `userType`
- Admin session uses `sessionStorage` admin object (`adminData`) with timeout and logout markers
- Shared theme key used in browser storage (`ibh-theme`)

Root-admin app:
- Stores JWT token in `localStorage` (`adminToken`)
- Stores decoded user payload in `localStorage` (`adminUser`)

## Cross-Cutting Concerns
- Validation centralized in utility functions
- API wrappers include retries, timeout behavior, and typed error handling in several modules
- Route guards and leave-page session logic implemented in auth guard utilities
- Chatbot UI is embedded in main app pages via floating action button/component

## Design Boundaries
- Core frontend behavior and chatbot behavior are documented separately
- Chatbot-specific operation and safety logic is isolated under `chatbot-addon/`
