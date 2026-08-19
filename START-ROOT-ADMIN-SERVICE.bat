@echo off
REM Start Root-Admin Service on port 8084
cd banking-application-microservices\root-admin-service
echo Starting Root-Admin Service on port 8084...
call mvnw.cmd spring-boot:run
pause
