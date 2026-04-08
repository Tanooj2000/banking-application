# Root Admin Service - JWT Authentication

This service implements JWT-based role authentication with the following setup:

## Configuration
- **JWT Secret**: `myAdminSecretKeyForBankingAdminService123456789` (same as admin-service)
- **JWT Expiration**: `86400000` ms (24 hours)
- **Port**: `8084`

## Endpoints

### 1. Sign In (No authentication required)
```http
POST /api/root/signin
Content-Type: application/json

{
  "username": "rootadmin",
  "password": "rootpass"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sign in successful",
  "token": "eyJhbGciOiJIUzUxMiJ9..."
}
```

### 2. Health Check (No authentication required)
```http
GET /api/root/health
```

**Response:**
```json
{
  "status": "UP",
  "service": "root-admin-service"
}
```

### 3. Get User Profile (Requires ROOT_ADMIN role)
```http
GET /api/root/profile
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "username": "rootadmin",
  "roles": ["ROLE_ROOT_ADMIN"],
  "isRootAdmin": true
}
```

### 4. Admin Actions (Requires ROOT_ADMIN role)
```http
GET /api/root/admin-actions
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "message": "Welcome to Root Admin Dashboard",
  "user": "rootadmin",
  "access_level": "ROOT_ADMIN"
}
```

### 5. Verify Admin (Requires ROOT_ADMIN role)
```http
POST /api/root/verify-admin
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "adminUsername": "admin1",
  "rootUsername": "rootadmin",
  "rootPassword": "rootpass"
}
```

## Usage Flow

1. **Sign In**: Call `/api/root/signin` with root admin credentials
2. **Get JWT Token**: Extract the token from the response
3. **Access Protected Endpoints**: Include the token in Authorization header as `Bearer <token>`

## Security Features

- **JWT Token-based Authentication**: Stateless authentication using JWT
- **Role-based Authorization**: Different endpoints require specific roles
- **Token Expiration**: Tokens automatically expire after 24 hours
- **Spring Security Integration**: Leverages Spring Security for comprehensive security
- **CORS Support**: Configured for cross-origin requests

## Role Hierarchy
- **ROOT_ADMIN**: Full access to all endpoints
- **ADMIN**: Limited access (can be extended)
- **USER**: Basic access (can be extended)

## Error Handling
- **401 Unauthorized**: Invalid or expired token
- **403 Forbidden**: Insufficient role permissions
- **400 Bad Request**: Invalid request format