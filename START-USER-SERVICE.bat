@echo off
REM Start User Service on port 8081
cd banking-application-microservices\user-service
echo Starting User Service on port 8081...
call mvnw.cmd spring-boot:run
pause
