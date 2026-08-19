@echo off
REM Start Admin Service on port 8083
cd banking-application-microservices\admin-service
echo Starting Admin Service on port 8083...
call mvnw.cmd spring-boot:run
pause
