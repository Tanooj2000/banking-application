# ⚠️ CRITICAL: 8 SEPARATE TERMINALS REQUIRED

**If you see "refused to connect" or "Cannot reach backend", it's because the services aren't running.**

---

## 🚨 **YOU MUST DO THIS MANUALLY - ONE TERMINAL PER SERVICE**

Each service needs its **own dedicated Command Prompt window** that stays open and running the service continuously.

---

## **STEP 1: Open 8 Separate Command Prompt Windows**

Press `Win + R`, type `cmd`, then click OK. **Repeat 8 times** to open 8 separate Command Prompt windows.

You should now have 8 Command Prompt windows open on your screen.

---

## **STEP 2: In Each Window, Run ONE Service**

### **Window 1: User Service (Port 8081)**
```
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\user-service
mvnw.cmd spring-boot:run
```
**Wait for:** `Tomcat started on port 8081` (keep this window open)

---

### **Window 2: Bank Service (Port 8082)**
```
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\bank-service
mvnw.cmd spring-boot:run
```
**Wait for:** `Tomcat started on port 8082` (keep this window open)

---

### **Window 3: Admin Service (Port 8083)**
```
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\admin-service
mvnw.cmd spring-boot:run
```
**Wait for:** `Tomcat started on port 8083` (keep this window open)

---

### **Window 4: Root-Admin Service (Port 8084)**
```
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\root-admin-service
mvnw.cmd spring-boot:run
```
**Wait for:** `Tomcat started on port 8084` (keep this window open)

---

### **Window 5: Account Service (Port 8085)**
```
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\account-service
mvnw.cmd spring-boot:run
```
**Wait for:** `Tomcat started on port 8085` (keep this window open)

---

### **Window 6: Chatbot Service (Port 8086)**
```
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\chatbot-service
mvnw.cmd spring-boot:run
```
**Wait for:** `Tomcat started on port 8086` (keep this window open)

---

### **Window 7: Main Frontend (Port 5173)**
```
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-frontend\bankingapplication
npm install
npm run dev
```
**Wait for:** `Local: http://localhost:5173/` (keep this window open)

---

### **Window 8: Root-Admin Frontend (Port 5174)**
```
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-frontend\root-admin
npm install
npm run dev
```
**Wait for:** `Local: http://localhost:5174/` (keep this window open)

---

## ✅ **When All 8 Services Are Running**

You should see 8 Command Prompt windows, each showing:

| Window | Service | Expected Message |
|--------|---------|------------------|
| 1 | User Service | `Tomcat started on port 8081` |
| 2 | Bank Service | `Tomcat started on port 8082` |
| 3 | Admin Service | `Tomcat started on port 8083` |
| 4 | Root-Admin Service | `Tomcat started on port 8084` |
| 5 | Account Service | `Tomcat started on port 8085` |
| 6 | Chatbot Service | `Tomcat started on port 8086` |
| 7 | Main Frontend | `Local: http://localhost:5173/` |
| 8 | Root-Admin Frontend | `Local: http://localhost:5174/` |

**NONE of these windows should be closed while you're testing.**

---

## 🌐 **Open in Browser**

Once all 8 windows show their success messages:

- **Main App:** http://localhost:5173
- **Root-Admin App:** http://localhost:5174

Both should now load without "refused to connect" errors.

---

## 🔍 **Verify Services Are Running**

If you still get "refused to connect", check that each backend is actually running by opening these in your browser:

- http://localhost:8081/api/user/health
- http://localhost:8082/api/banks
- http://localhost:8083/api/admin/health
- http://localhost:8084/api/root/health
- http://localhost:8085/api/accounts/health
- http://localhost:8086/api/v1/chatbot/health

If any return "page cannot be reached", that service is NOT running.

---

## ❌ **Common Mistakes**

### ❌ Mistake 1: Running all commands in ONE Command Prompt window
- **Wrong:** Type all 8 commands in one window (they'll run sequentially)
- **Right:** Open 8 separate windows and run ONE command per window

### ❌ Mistake 2: Closing a window while testing
- **Wrong:** Close the "User Service" window after it starts
- **Right:** Keep ALL windows open the entire time

### ❌ Mistake 3: Running commands with `.\mvnw` or `./mvnw`
- **Wrong:** `.\mvnw spring-boot:run` (might not work on all systems)
- **Right:** `mvnw.cmd spring-boot:run` (works on Windows)

### ❌ Mistake 4: Not waiting for "Tomcat started" message
- **Wrong:** Closing the window after "Building" or "Downloading"
- **Right:** Wait for the full "Tomcat started on port 808x" message

---

## ⏱️ **Expected Startup Times**

- **Backend services:** 15-30 seconds each (first time takes longer due to dependencies)
- **Frontend apps:** 5-10 seconds each
- **Total:** ~5-10 minutes for first full startup

---

## 🎯 **Confirmation You're Ready**

- [ ] All 8 Command Prompt windows are open and visible
- [ ] Each window shows its success message ("Tomcat started..." or "Local: http://...")
- [ ] You can browse to http://localhost:5173 without "refused to connect"
- [ ] You can browse to http://localhost:5174 without "refused to connect"
- [ ] Backend health checks (8081-8086) all respond with 200 OK

---

## ✨ **Ready to Test**

Once confirmed, you can:

1. **Sign up as user** on http://localhost:5173/signup
2. **Sign in** and create an account
3. **Test admin flows** on main app or root-admin app

**Keep all 8 Command Prompt windows open throughout testing!**
