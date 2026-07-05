@echo off
REM Start Root-Admin Frontend App on port 5174
cd banking-application-frontend\root-admin
echo Installing dependencies (if needed)...
call npm install --legacy-peer-deps
echo Starting Root-Admin App on port 5174...
call npm run dev
pause
