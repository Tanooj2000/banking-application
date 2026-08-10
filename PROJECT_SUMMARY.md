# InterBanking Hub — Complete Application Summarization

InterBanking Hub is a full-stack, multi-tier web-based banking platform built to simulate a real-world bank account management system. It supports three countries — **India, USA, and United Kingdom** — and serves three types of users: **end-users (customers)**, **branch admins**, and a **root admin**. The application is built with a microservices backend, a React frontend, and an AI-powered RAG chatbot assistant.

---

## Frontend

The frontend is built with **React 18 and Vite**, running on port 5173. It consists of multiple pages: a landing HomePage, SignUp and SignIn pages, a UserPage dashboard, a CreateAccount wizard, a BrowseBank page, an AdminPage, and an AboutPage. Authentication state is managed through JWT tokens stored in `localStorage`. Every API call automatically attaches an `Authorization: Bearer <token>` header. The `authGuard.js` utility protects routes — if a token is missing or a 401/403 is received from the backend, the user is immediately redirected to the sign-in page. On logout, the frontend calls the backend to blacklist the token server-side before clearing local storage.

The **CreateAccount page** is the most complex UI component — a 6-step multi-country wizard that collects Personal Details, Educational Details, Income Details, Nominee Details, Document Uploads, and a final Review & Submit step. Fields adapt based on the selected country: India collects PAN (10 alphanumeric) and Aadhaar (12 digits); USA collects SSN (auto-formatted XXX-XX-XXXX); UK collects NIN (9 alphanumeric). All fields have real-time blur-triggered validation — errors appear immediately when a user leaves a field, not just on submit. Field constraints are enforced at the input level: name fields accept only letters and spaces (max 30 chars), institution/course/occupation fields reject digits, phone/mobile fields accept only digits (max 15), and amount fields have an upper bound. The form auto-saves progress to `localStorage` between steps. Four document files (ID Proof, Address Proof, Income Proof, Photo) are required for submission.

---

## Microservices Backend

The backend is composed of **six independent Spring Boot 3 services**, each with its own MySQL database following the database-per-service pattern.

**User Service (port 8081)** handles user registration, login, logout, profile updates, and password changes. It is the primary authentication service — on login it generates a **JWT (HS256, 24-hour expiry)** that includes the `userId` claim. Spring Security is configured as stateless, with only `/register` and `/login` as public endpoints. All other endpoints require a valid Bearer token. Passwords are hashed with BCrypt. A `SessionService` maintains a token blacklist for server-side logout invalidation. Email notifications are sent via Gmail SMTP on registration.

**Account Service (port 8085)** handles the complete bank account application lifecycle. It uses the **Strategy Pattern** to handle country-specific logic through `IndiaAccountStrategy`, `UsaAccountStrategy`, and `UkAccountStrategy`. Each country has its own request DTO and validation rules. Account applications are submitted as multipart form data (fields + 4 document files). New applications start with status `PENDING` and transition to either `APPROVED` or `REJECTED` by an admin. Account types are country-specific: India supports Savings, Current, Salary, Fixed Deposit; USA supports Checking, Money Market, Certificate of Deposit; UK supports ISA and Fixed Term. The service also handles document storage and retrieval, and sends email notifications to admins when new applications arrive.

**Bank Service (port 8082)** manages the bank directory — storing bank name, branch, city, country, and IFSC/bank code. It provides filtering endpoints by country, by city, or by both. It supports single and bulk bank addition, a validation-only endpoint, and a bank code uniqueness check.

**Admin Service (port 8083)** manages branch-level admins. Admins register and log in with their own JWT flow. Once registered, admin accounts are in a pending state until approved by the Root Admin. Admins can approve or reject user account applications, manage user accounts, and update their own profile and password. Sensitive endpoints are protected with `@PreAuthorize("hasRole('ROOT_ADMIN')")`.

**Root Admin Service (port 8084)** is the top-level authority in the system. The root admin signs in with a separate service, receives a JWT with the `ROOT_ADMIN` role, and uses it to verify and activate pending branch admin accounts. This creates a three-tier hierarchy: Root Admin → Branch Admin → End User.

**RAG Chatbot Service (port 8086)** is a Spring Boot proxy service that receives chat requests from the frontend and forwards them to the Python FastAPI service. This decouples the frontend from the Python runtime.

---

## AI RAG Chatbot

The chatbot backend is a **FastAPI (Python) service on port 8000** using LangChain, FAISS vector store, and **Ollama running `llama3.2:3b` locally** — no external cloud AI API is needed. The knowledge base consists of text files covering account creation guides, admin guides, FAQs, and banking policies stored in `data/text_files/`. On startup, documents are loaded, chunked, and embedded into a FAISS vector store.

When a user asks a question, the chat orchestrator first checks a **FAQ cache** for a fast match. If no FAQ hit, it performs a **FAISS vector similarity search** to retrieve the top-K relevant chunks, then sends the context + question to the Ollama LLM for a natural language answer. Beyond answering knowledge-base questions, the orchestrator can perform **live API actions**: look up the user's accounts and application status, filter banks by country/city, update user profile details, and change passwords — all by making real HTTP calls to the Spring Boot microservices using the user's auth token. Per-user session state is maintained in a `SelectionStore` to support multi-turn conversations. Both `user` and `admin` user types are supported.

---

## Security Architecture

Security is implemented end-to-end. JWTs are signed with HS256 using a configured secret key with a 24-hour expiry. Each Spring Boot service that requires auth runs a `JwtAuthenticationFilter` that intercepts every request, extracts the Bearer token, validates the signature and expiry, and sets the Spring Security context. Passwords are stored as BCrypt hashes. CORS is configured on each service to allow the frontend origin. The Root Admin and Admin services use role-based access control (`@PreAuthorize`) for the most sensitive operations. The frontend enforces auth via `authGuard.js` and automatically handles token expiry by catching 401/403 responses.

---

## Key Design Patterns

The application applies several recognized software design patterns: **Strategy Pattern** for country-specific account creation logic, **Repository Pattern** via Spring Data JPA, **DTO Pattern** to separate API contracts from database entities, **Filter Chain Pattern** for JWT authentication, **Proxy Pattern** for the chatbot middleware service, **RAG Pattern** for AI-augmented question answering, and a **Guard Pattern** on the frontend for route protection.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, CSS Modules |
| Backend Services | Spring Boot 3 (Java 17) |
| AI Chatbot API | FastAPI (Python) |
| Chatbot Middleware | Spring Boot (proxy service) |
| LLM | Ollama — llama3.2:3b (runs locally) |
| Vector Store | FAISS (local embeddings) |
| Databases | MySQL (per service — database-per-service pattern) |
| Auth | JWT HS256, 24h expiry, BCrypt passwords |
| Email | Gmail SMTP |

---

## Service Port Reference

| Service | Port | Database |
|---|---|---|
| User Service | 8081 | userdb |
| Bank Service | 8082 | bankdb |
| Admin Service | 8083 | admindb |
| Root Admin Service | 8084 | rootadmindb |
| Account Service | 8085 | accountdb |
| RAG Chatbot Service (proxy) | 8086 | — |
| FastAPI RAG API | 8000 | — (FAISS local) |
| React Frontend | 5173 | — |

---

## Account Types by Country

| Country | Account Types |
|---|---|
| India | Savings, Current, Salary, Fixed Deposit |
| USA | Checking, Money Market, Certificate of Deposit |
| UK | ISA, Fixed Term |

---

## Data Flow Summary (End-to-End)

A new user visits the app, registers (user-service creates the account and sends a welcome email), then logs in and receives a JWT. They browse the bank directory (bank-service) to pick a bank, then go through the 6-step CreateAccount wizard, upload 4 documents, and submit. The account-service stores the application as PENDING and emails the branch admin. The admin logs in to the AdminPage, reviews the application, and approves or rejects it. The user can check their status on the UserPage. At any point, the RAG chatbot (accessible via a floating button) can answer questions about the process or fetch live data like account status, bank listings, or perform profile updates — all through natural language conversation.

---

## User Hierarchy

```
Root Admin
    └── Branch Admin (verified by Root Admin)
            └── End User (account applications reviewed by Branch Admin)
```
