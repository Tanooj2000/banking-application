@echo off
REM Start Main Frontend App on port 5173
cd banking-application-frontend\bankingapplication
echo Installing dependencies (if needed)...
call npm install --legacy-peer-deps
echo Starting Main App on port 5173...
call npm run dev
pause
