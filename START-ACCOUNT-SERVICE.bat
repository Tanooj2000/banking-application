@echo off
REM Start Account Service on port 8085
cd banking-application-microservices\account-service
echo Starting Account Service on port 8085...
call mvnw.cmd spring-boot:run
pause
