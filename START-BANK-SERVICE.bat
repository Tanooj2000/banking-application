@echo off
REM Start Bank Service on port 8082
cd banking-application-microservices\bank-service
echo Starting Bank Service on port 8082...
call mvnw.cmd spring-boot:run
pause
