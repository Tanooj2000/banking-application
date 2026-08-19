# Quick Start Guide - All Services & Links

**Created:** 2026-04-29 (after config stabilization)

---

## 🚀 **STEP 1: Start All Backend Microservices** (6 terminals)

### Terminal 1: User Service (8081)
```bash
cd banking-application-microservices/user-service
./mvnw spring-boot:run
```
✅ **Link when ready:** http://localhost:8081/api/user/health

---

### Terminal 2: Bank Service (8082)
```bash
cd banking-application-microservices/bank-service
./mvnw spring-boot:run
```
✅ **Link when ready:** http://localhost:8082/api/banks

---

### Terminal 3: Admin Service (8083)
```bash
cd banking-application-microservices/admin-service
./mvnw spring-boot:run
```
✅ **Link when ready:** http://localhost:8083/api/admin/health

---

### Terminal 4: Root-Admin Service (8084)
```bash
cd banking-application-microservices/root-admin-service
./mvnw spring-boot:run
```
✅ **Link when ready:** http://localhost:8084/api/root/health

---

### Terminal 5: Account Service (8085)
```bash
cd banking-application-microservices/account-service
./mvnw spring-boot:run
```
✅ **Link when ready:** http://localhost:8085/api/accounts/health

---

### Terminal 6: Chatbot Service (8086)
```bash
cd banking-application-microservices/chatbot-service
./mvnw spring-boot:run
```
✅ **Link when ready:** http://localhost:8086/api/v1/chatbot/health

---

## 🎨 **STEP 2: Start Frontend Apps** (2 terminals)

### Terminal 7: Main App (5173)
```bash
cd banking-application-frontend/bankingapplication
npm install  # if needed
npm run dev
```
✅ **MAIN APP URL:** http://localhost:5173

**Test these flows:**
- Sign up as user → Sign in → Create account (India/USA/UK) → User dashboard
- Sign up as admin → Sign in → Admin dashboard (approve/reject accounts)
- Browse bank branches (no auth needed)

---

### Terminal 8: Root-Admin App (5174)
```bash
cd banking-application-frontend/root-admin
npm install  # if needed
npm run dev
```
✅ **ROOT-ADMIN URL:** http://localhost:5174

**Test these flows:**
- Sign in with root-admin credentials → Review pending admin applications → Approve/Reject

---

## 📋 **Service Health Check Endpoints** (All running on canonical ports)

| Service | Port | Health Check Link |
|---------|------|-------------------|
| User Service | 8081 | http://localhost:8081/api/user/health |
| Bank Service | 8082 | http://localhost:8082/api/banks |
| Admin Service | 8083 | http://localhost:8083/api/admin/health |
| Root-Admin Service | 8084 | http://localhost:8084/api/root/health |
| Account Service | 8085 | http://localhost:8085/api/accounts/health |
| Chatbot Service | 8086 | http://localhost:8086/api/v1/chatbot/health |

---

## 🧪 **Quick Test URLs (After all services start)**

### Main App Flows
| Flow | URL | Description |
|------|-----|-------------|
| **Sign In** | http://localhost:5173/signin | User/Admin login page |
| **Sign Up** | http://localhost:5173/signup | User/Admin registration |
| **Browse Banks** | http://localhost:5173/browsepage | View branches (no auth) |
| **Create Account** | http://localhost:5173/createaccount | Account application (India/USA/UK) |
| **User Dashboard** | http://localhost:5173/userpage | View/manage user accounts |
| **Admin Dashboard** | http://localhost:5173/adminpage | Approve/reject applications |

### Root-Admin App
| Flow | URL | Description |
|------|-----|-------------------|
| **Sign In** | http://localhost:5174 | Root-admin login |
| **Dashboard** | http://localhost:5174/admin/dashboard | Review admin applications |

---

## 🔗 **API Test URLs (Curl Examples)**

### Check if services are running (in browser or curl)
```bash
# User Service
curl http://localhost:8081/api/user/health

# Bank Service  
curl http://localhost:8082/api/banks

# Admin Service
curl http://localhost:8083/api/admin/health

# Root-Admin Service
curl http://localhost:8084/api/root/health

# Account Service
curl http://localhost:8085/api/accounts/health

# Chatbot Service
curl http://localhost:8086/api/v1/chatbot/health
```

### Test Chatbot Integration
```bash
curl -X POST http://localhost:8086/api/v1/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Check my application status for user ID 123",
    "userId": "user123",
    "sessionId": null,
    "context": "banking-app"
  }'
```

---

## ✅ **Canonical Port Map (Now Locked)**

```
FRONTEND:
  - Main App ................... http://localhost:5173
  - Root-Admin App ............ http://localhost:5174

BACKEND (All microservices):
  - User Service .............. http://localhost:8081
  - Bank Service .............. http://localhost:8082
  - Admin Service ............. http://localhost:8083
  - Root-Admin Service ........ http://localhost:8084
  - Account Service ........... http://localhost:8085
  - Chatbot Service ........... http://localhost:8086

DATABASE:
  - MySQL ..................... localhost:3306
    - User: bankapp
    - Password: BankApp@123
    - All databases created automatically

EMAIL:
  - Gmail App Password ....... sufd mtak snum ahgc
    - User: noreplyinterbankinghub@gmail.com
    - SMTP: smtp.gmail.com:587
```

---

## 🎯 **User Journey Testing Checklist**

After all services are running, test these critical flows:

### 1. **User Sign-Up & Sign-In** ✓
- [ ] Navigate to http://localhost:5173/signup
- [ ] Create user account
- [ ] Navigate to http://localhost:5173/signin
- [ ] Sign in with created credentials
- [ ] Verify redirect to user dashboard

### 2. **Admin Sign-Up & Sign-In** ✓
- [ ] At http://localhost:5173/signup, toggle to Admin mode
- [ ] Create admin account
- [ ] Sign in and verify admin dashboard loads
- [ ] Confirm email sent (check if mail service working)

### 3. **Create Account (India/USA/UK)** ✓
- [ ] Sign in as user
- [ ] Navigate to http://localhost:5173/createaccount
- [ ] Select country (India/USA/UK)
- [ ] Fill form and upload documents
- [ ] Submit and verify success message
- [ ] Check Account Service (8085) received multipart upload

### 4. **Admin Approval Flow** ✓
- [ ] Sign in as admin
- [ ] Navigate to http://localhost:5173/adminpage
- [ ] View pending account requests
- [ ] Approve/Reject an account
- [ ] Verify status update on account service

### 5. **Root-Admin Review** ✓
- [ ] Navigate to http://localhost:5174
- [ ] Sign in with root-admin credentials
- [ ] Navigate to dashboard
- [ ] Review pending admin applications
- [ ] Approve/Reject admin application

### 6. **Chatbot Integration** ✓
- [ ] Open http://localhost:5173
- [ ] Click chat button (💬)
- [ ] Test query: "Check my application status for user ID 123"
- [ ] Verify chatbot connects to account-service (8085)

---

## 🔧 **Troubleshooting Quick Links**

| Issue | Check | URL |
|-------|-------|-----|
| Service won't start | Port already in use? | Check task manager or `netstat -ano \| findstr :808x` |
| API returns 503 | Service health | http://localhost:8086/api/v1/chatbot/health |
| CORS error in browser | Frontend port | Should be 5173 (main) or 5174 (root-admin) |
| Email not sending | Mail config | User-service (8081) password should be `sufd mtak snum ahgc` |
| Can't access admin functions | Check admin-service | http://localhost:8083/api/admin/health |
| Chatbot unavailable | Chatbot service | http://localhost:8086/api/v1/chatbot/health |

---

## 📝 **Configuration Files (If Adjustments Needed)**

- [Main Frontend Config](banking-application-frontend/bankingapplication/vite.config.mjs) - Port 5173
- [Root-Admin Config](banking-application-frontend/root-admin/vite.config.js) - Port 5174
- [Backend Runbook](banking-application-frontend/docs/frontend/runbook/dev-ops.md) - All ports documented
- [User Service Mail](banking-application-microservices/user-service/src/main/resources/application.yml) - Mail password: sufd mtak snum ahgc
- [Account Service URLs](banking-application-microservices/account-service/src/main/resources/application.yml) - Admin service URL: http://localhost:8083

---

## ✨ **All Tests Pass When:**

✅ All 6 backend services running on correct ports (8081-8086)  
✅ Both frontend apps accessible (5173, 5174)  
✅ No CORS errors in browser console  
✅ All user journeys complete without connection timeouts  
✅ Chatbot service connects to account-service  
✅ Mail notifications sent when accounts created/approved  
✅ No 401/403 auth errors for expected flows  
✅ No stale port references in console logs  

**System is production-ready on your local machine!** 🚀
