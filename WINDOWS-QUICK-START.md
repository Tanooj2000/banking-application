# Windows Batch Startup Scripts - EASY START

**Created:** 2026-04-29 (Fixed Windows command syntax issue)

---

## ⚠️ **IMPORTANT: MySQL Must Be Running First!**

Before starting any service, ensure MySQL is running on `localhost:3306`:
- User: `bankapp`
- Password: `BankApp@123`

If MySQL isn't running, all services will fail with database connection errors.

---

## 🚀 **Quick Start - Open 8 Command Prompts and Run These Scripts**

### **Backend Services** (Run in 6 separate Command Prompts/PowerShell windows)

| Service | File | Port | Command |
|---------|------|------|---------|
| User Service | `START-USER-SERVICE.bat` | 8081 | Double-click the file |
| Bank Service | `START-BANK-SERVICE.bat` | 8082 | Double-click the file |
| Admin Service | `START-ADMIN-SERVICE.bat` | 8083 | Double-click the file |
| Root-Admin Service | `START-ROOT-ADMIN-SERVICE.bat` | 8084 | Double-click the file |
| Account Service | `START-ACCOUNT-SERVICE.bat` | 8085 | Double-click the file |
| Chatbot Service | `START-CHATBOT-SERVICE.bat` | 8086 | Double-click the file |

### **Frontend Apps** (Run in 2 separate Command Prompts/PowerShell windows)

| App | File | Port | Command |
|-----|------|------|---------|
| Main App | `START-MAIN-FRONTEND.bat` | 5173 | Double-click the file |
| Root-Admin App | `START-ROOT-ADMIN-FRONTEND.bat` | 5174 | Double-click the file |

---

## 📍 **File Locations**

All `.bat` files are in the root of the workspace:
```
banking-application/
├── START-USER-SERVICE.bat
├── START-BANK-SERVICE.bat
├── START-ADMIN-SERVICE.bat
├── START-ROOT-ADMIN-SERVICE.bat
├── START-ACCOUNT-SERVICE.bat
├── START-CHATBOT-SERVICE.bat
├── START-MAIN-FRONTEND.bat
├── START-ROOT-ADMIN-FRONTEND.bat
```

---

## ✅ **Step-by-Step Instructions**

### **Step 1: Start Backend Services**

Open 6 separate Command Prompts/PowerShell windows and double-click the corresponding batch file in each:

1. **Window 1:** Double-click `START-USER-SERVICE.bat`
   - Should show: `Tomcat started on port 8081`

2. **Window 2:** Double-click `START-BANK-SERVICE.bat`
   - Should show: `Tomcat started on port 8082`

3. **Window 3:** Double-click `START-ADMIN-SERVICE.bat`
   - Should show: `Tomcat started on port 8083`

4. **Window 4:** Double-click `START-ROOT-ADMIN-SERVICE.bat`
   - Should show: `Tomcat started on port 8084`

5. **Window 5:** Double-click `START-ACCOUNT-SERVICE.bat`
   - Should show: `Tomcat started on port 8085`

6. **Window 6:** Double-click `START-CHATBOT-SERVICE.bat`
   - Should show: `Tomcat started on port 8086`

**⏳ Wait 1-2 minutes for all services to fully start.**

### **Step 2: Start Frontend Apps** (after all backends show "started")

7. **Window 7:** Double-click `START-MAIN-FRONTEND.bat`
   - Should show: `Local: http://localhost:5173/`
   - ✅ **OPEN MAIN APP:** http://localhost:5173

8. **Window 8:** Double-click `START-ROOT-ADMIN-FRONTEND.bat`
   - Should show: `Local: http://localhost:5174/`
   - ✅ **OPEN ROOT-ADMIN APP:** http://localhost:5174

---

## 🔗 **Quick Access Links**

### **Main App** (once running on 5173)
- Sign In: http://localhost:5173/signin
- Sign Up: http://localhost:5173/signup
- Create Account: http://localhost:5173/createaccount
- User Dashboard: http://localhost:5173/userpage
- Admin Dashboard: http://localhost:5173/adminpage
- Browse Banks: http://localhost:5173/browsepage

### **Root-Admin App** (once running on 5174)
- Sign In: http://localhost:5174
- Dashboard: http://localhost:5174/admin/dashboard

### **Backend Health Checks**
- User Service: http://localhost:8081/api/user/health
- Bank Service: http://localhost:8082/api/banks
- Admin Service: http://localhost:8083/api/admin/health
- Root-Admin Service: http://localhost:8084/api/root/health
- Account Service: http://localhost:8085/api/accounts/health
- Chatbot Service: http://localhost:8086/api/v1/chatbot/health

---

## 🧪 **Test Checklist**

Once all services and frontends are running:

- [ ] Can you access http://localhost:5173? (main app should load)
- [ ] Can you access http://localhost:5174? (root-admin app should load)
- [ ] Can you sign up as a user on main app?
- [ ] Can you sign in and see the dashboard?
- [ ] Can you create an account (India/USA/UK)?
- [ ] Can you upload documents?
- [ ] Can you see pending accounts in admin dashboard?
- [ ] Can you approve/reject accounts?
- [ ] Can root-admin see pending admin applications?

---

## 🆘 **Troubleshooting**

### **Error: "refused to connect"**
- Check that ALL 6 backend services are running
- Look for green "Tomcat started on port 808x" messages
- Wait 2-3 minutes for all services to fully initialize

### **Error: "Cannot connect to database"**
- Ensure MySQL is running on localhost:3306
- Verify user is `bankapp` and password is `BankApp@123`
- Create the databases if they don't exist

### **Error: "Port already in use"**
- Close any other instances of the services
- Use `netstat -ano | findstr :8081` to find what's using the port
- Kill the process with `taskkill /PID <PID> /F`

### **Frontend shows blank page**
- Wait for backend services to fully start
- Try refreshing the page (Ctrl+R)
- Check browser console (F12 → Console) for JavaScript errors

### **npm not found when running frontend batch files**
- Ensure Node.js is installed and in your PATH
- Open a PowerShell/Command Prompt and type `npm --version`
- If not found, install Node.js from https://nodejs.org

---

## 📝 **Port Map Reference**

```
FRONTEND (Vite Dev Server):
  - Main App ................... localhost:5173
  - Root-Admin App ............ localhost:5174

BACKEND (Spring Boot on Tomcat):
  - User Service .............. localhost:8081
  - Bank Service .............. localhost:8082
  - Admin Service ............. localhost:8083
  - Root-Admin Service ........ localhost:8084
  - Account Service ........... localhost:8085
  - Chatbot Service ........... localhost:8086

DATABASE:
  - MySQL ..................... localhost:3306 (user: bankapp)
```

---

## ✨ **All Running When:**

✅ All 6 backend batch windows show "Tomcat started on port 808x"  
✅ Both frontend batch windows show "Local: http://localhost:517x/"  
✅ No red error messages in any window  
✅ Can access http://localhost:5173 and http://localhost:5174 in browser  
✅ All links under "Backend Health Checks" respond with 200 OK  

**You're all set! 🚀**
