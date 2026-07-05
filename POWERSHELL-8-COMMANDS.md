# ALL 8 COMMANDS - POWERSHELL VERSION

**You're in PowerShell - use these commands with semicolons (;) not ampersands (&&)**

---

## TERMINAL 1: User Service (Port 8081)
```powershell
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\user-service ; mvnw.cmd spring-boot:run
```

---

## TERMINAL 2: Bank Service (Port 8082)
```powershell
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\bank-service ; mvnw.cmd spring-boot:run
```

---

## TERMINAL 3: Admin Service (Port 8083)
```powershell
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\admin-service ; mvnw.cmd spring-boot:run
```

---

## TERMINAL 4: Root-Admin Service (Port 8084)
```powershell
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\root-admin-service ; mvnw.cmd spring-boot:run
```

---

## TERMINAL 5: Account Service (Port 8085)
```powershell
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\account-service ; mvnw.cmd spring-boot:run
```

---

## TERMINAL 6: Chatbot Service (Port 8086)
```powershell
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\chatbot-service ; mvnw.cmd spring-boot:run
```

---

## TERMINAL 7: Main Frontend (Port 5173)
```powershell
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-frontend\bankingapplication ; npm install ; npm run dev
```

---

## TERMINAL 8: Root-Admin Frontend (Port 5174)
```powershell
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-frontend\root-admin ; npm install ; npm run dev
```

---

## 🔑 KEY DIFFERENCE

❌ **WRONG (Bash/CMD syntax):**
```
cd path && command
```

✅ **RIGHT (PowerShell syntax):**
```powershell
cd path ; command
```

Use **semicolons (;)** in PowerShell, not double ampersands (&&).

---

## ✅ COPY & PASTE

Just copy each command above (with semicolons) into each PowerShell terminal and press Enter.
