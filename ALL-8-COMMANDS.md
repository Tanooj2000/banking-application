# ALL 8 COMMANDS - COPY & PASTE READY

**You have 8 terminals open. Copy one command into each terminal and press Enter.**

---

## TERMINAL 1: User Service (Port 8081)
```
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\user-service && mvnw.cmd spring-boot:run
```

---

## TERMINAL 2: Bank Service (Port 8082)
```
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\bank-service && mvnw.cmd spring-boot:run
```

---

## TERMINAL 3: Admin Service (Port 8083)
```
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\admin-service && mvnw.cmd spring-boot:run
```

---

## TERMINAL 4: Root-Admin Service (Port 8084)
```
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\root-admin-service && mvnw.cmd spring-boot:run
```

---

## TERMINAL 5: Account Service (Port 8085)
```
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\account-service && mvnw.cmd spring-boot:run
```

---

## TERMINAL 6: Chatbot Service (Port 8086)
```
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-microservices\chatbot-service && mvnw.cmd spring-boot:run
```

---

## TERMINAL 7: Main Frontend (Port 5173)
```
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-frontend\bankingapplication && npm install && npm run dev
```

---

## TERMINAL 8: Root-Admin Frontend (Port 5174)
```
cd c:\Users\SH20580875\BankingAppPOC\banking-application\banking-application-frontend\root-admin && npm install && npm run dev
```

---

## ✅ QUICK REFERENCE

| Terminal | Service | Command | Port | Success Message |
|----------|---------|---------|------|-----------------|
| 1 | User | `cd ...\user-service && mvnw.cmd spring-boot:run` | 8081 | `Tomcat started on port 8081` |
| 2 | Bank | `cd ...\bank-service && mvnw.cmd spring-boot:run` | 8082 | `Tomcat started on port 8082` |
| 3 | Admin | `cd ...\admin-service && mvnw.cmd spring-boot:run` | 8083 | `Tomcat started on port 8083` |
| 4 | Root-Admin | `cd ...\root-admin-service && mvnw.cmd spring-boot:run` | 8084 | `Tomcat started on port 8084` |
| 5 | Account | `cd ...\account-service && mvnw.cmd spring-boot:run` | 8085 | `Tomcat started on port 8085` |
| 6 | Chatbot | `cd ...\chatbot-service && mvnw.cmd spring-boot:run` | 8086 | `Tomcat started on port 8086` |
| 7 | Main App | `cd ...\bankingapplication && npm install && npm run dev` | 5173 | `Local: http://localhost:5173/` |
| 8 | Root-Admin | `cd ...\root-admin && npm install && npm run dev` | 5174 | `Local: http://localhost:5174/` |

---

## 🎯 EXECUTION ORDER

1. Copy command from **TERMINAL 1** and paste into your first terminal
2. Copy command from **TERMINAL 2** and paste into your second terminal
3. Copy command from **TERMINAL 3** and paste into your third terminal
4. Copy command from **TERMINAL 4** and paste into your fourth terminal
5. Copy command from **TERMINAL 5** and paste into your fifth terminal
6. Copy command from **TERMINAL 6** and paste into your sixth terminal
7. Copy command from **TERMINAL 7** and paste into your seventh terminal
8. Copy command from **TERMINAL 8** and paste into your eighth terminal

---

## ⏱️ WAIT FOR SUCCESS MESSAGES

After each command, wait for the **success message** to appear (1-3 minutes per service):

**Backend services (Terminals 1-6):** Look for `Tomcat started on port 808x`
**Frontend apps (Terminals 7-8):** Look for `Local: http://localhost:517x/`

---

## 🌐 THEN OPEN IN BROWSER

Once Terminal 7 shows `Local: http://localhost:5173/` and Terminal 8 shows `Local: http://localhost:5174/`:

- **Main App:** http://localhost:5173
- **Root-Admin App:** http://localhost:5174

---

## ✨ ALL RUNNING WHEN

- Terminal 1: Shows `Tomcat started on port 8081`
- Terminal 2: Shows `Tomcat started on port 8082`
- Terminal 3: Shows `Tomcat started on port 8083`
- Terminal 4: Shows `Tomcat started on port 8084`
- Terminal 5: Shows `Tomcat started on port 8085`
- Terminal 6: Shows `Tomcat started on port 8086`
- Terminal 7: Shows `Local: http://localhost:5173/`
- Terminal 8: Shows `Local: http://localhost:5174/`

**Keep all 8 terminals open and running!**
