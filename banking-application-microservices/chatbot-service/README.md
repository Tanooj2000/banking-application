# Chatbot Service

A comprehensive chatbot microservice for the Banking Application, providing intelligent customer support and banking assistance.

## Features

- **Natural Language Processing**: Understands and responds to banking-related queries
- **24/7 Availability**: Always available to assist customers
- **Multi-session Support**: Handles multiple user sessions simultaneously
- **Quick Reply Suggestions**: Provides contextual quick reply options
- **Banking-specific Knowledge**: Expertise in account services, transfers, loans, and cards
- **RESTful API**: Easy integration with frontend applications
- **Error Handling**: Comprehensive error handling and user-friendly messages

## Supported Banking Queries

- Account balance inquiries
- Money transfers and payments
- Loan information and applications
- Credit/Debit card services
- Branch and ATM locations
- Account statements
- Investment information
- Interest rate information
- General customer support

## API Endpoints

### 1. Process Chat Message
```
POST /api/v1/chatbot/chat
Content-Type: application/json

{
  "message": "What is my account balance?",
  "userId": "user123",
  "sessionId": "optional_session_id",
  "context": "optional_context"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "response": "I can help you check your account balance...",
    "sessionId": "session_1234567890_1234",
    "timestamp": "2024-04-22T10:30:00",
    "botName": "Banking Assistant",
    "messageId": "msg_1234567890_123",
    "quickReplies": ["Check Balance", "Transfer Money", "Account Statement"]
  }
}
```

### 2. Health Check
```
GET /api/v1/chatbot/health
```

**Response:**
```json
{
  "status": "UP",
  "service": "Chatbot Service",
  "timestamp": 1713780600000
}
```

### 3. Get Capabilities
```
GET /api/v1/chatbot/capabilities
```

**Response:**
```json
{
  "success": true,
  "capabilities": "Banking Assistant Capabilities:\n• Account Balance Inquiries\n..."
}
```

### 4. Service Status
```
GET /api/v1/chatbot/status
```

## Quick Start

### Prerequisites
- Java 17 or higher
- Maven 3.6+

### Running the Service

1. **Build the project:**
```bash
./mvnw clean package
```

2. **Run the application:**
```bash
./mvnw spring-boot:run
```

3. **Access the service:**
- API Base URL: `http://localhost:8086/api/v1/chatbot`
- H2 Database Console: `http://localhost:8086/h2-console`

### Configuration

The service can be configured through `application.properties`:

```properties
# Server Configuration
server.port=8085

# Database Configuration
spring.datasource.url=jdbc:h2:mem:chatbotdb
spring.datasource.username=sa
spring.datasource.password=password

# Chatbot Configuration
chatbot.response.timeout=30000
chatbot.max.message.length=1000
chatbot.session.timeout=1800000
```

## Integration with Frontend

The chatbot service is designed to work with the existing frontend API configuration in `chatBotApi.js`. Simply ensure the service is running on the configured port (8085) and the frontend will be able to communicate with the chatbot.

## Development

### Project Structure
```
src/
├── main/
│   ├── java/
│   │   └── com/bankingapp/chatbot/
│   │       ├── ChatbotServiceApplication.java
│   │       ├── controller/
│   │       │   └── ChatbotController.java
│   │       ├── service/
│   │       │   └── ChatbotService.java
│   │       └── dto/
│   │           ├── ChatRequestDTO.java
│   │           └── ChatResponseDTO.java
│   └── resources/
│       └── application.properties
└── test/
    └── java/
```

### Testing

Run tests with:
```bash
./mvnw test
```

### Building for Production

```bash
./mvnw clean package -Pprod
java -jar target/chatbot-service-0.0.1-SNAPSHOT.jar
```

## Error Handling

The service includes comprehensive error handling:

- **Validation Errors**: Invalid request data
- **Service Errors**: Internal processing issues  
- **Timeout Errors**: Long response times
- **Authentication Errors**: Invalid or missing tokens

## Security

- JWT token authentication support
- CORS configuration for frontend integration
- Input validation and sanitization
- Error message sanitization

## Future Enhancements

- Integration with external AI services (OpenAI, Azure Cognitive Services)
- Advanced NLP capabilities
- Conversation history persistence
- Analytics and reporting
- Multi-language support
- Voice chat capabilities

## Support

For issues or questions regarding the chatbot service, please contact the development team or create an issue in the project repository.