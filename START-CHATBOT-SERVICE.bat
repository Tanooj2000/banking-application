@echo off
REM Start Chatbot Service on port 8086
cd banking-application-microservices\chatbot-service
echo Starting Chatbot Service on port 8086...
call mvnw.cmd spring-boot:run
pause
