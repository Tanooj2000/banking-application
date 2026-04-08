# Testing JWT Authentication with cURL

## 1. Sign In to get JWT Token

```bash
curl -X POST http://localhost:8084/api/root/signin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "rootadmin",
    "password": "rootpass"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Sign in successful", 
  "token": "eyJhbGciOiJIUzUxMiJ9.eyJyb2xlcyI6WyJST0xFX1JPT1RfQURNSU4iXSwic3ViIjoicm9vdGFkbWluIiwiaWF0IjoxNzMzNzI4NDM0LCJleHAiOjE3MzM4MTQ4MzR9.example"
}
```

## 2. Test Health Endpoint (No Auth Required)

```bash
curl -X GET http://localhost:8084/api/root/health
```

## 3. Access Protected Profile Endpoint

**Replace `<YOUR_JWT_TOKEN>` with the token from step 1:**

```bash
curl -X GET http://localhost:8084/api/root/profile \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

## 4. Access Admin Actions Endpoint

```bash
curl -X GET http://localhost:8084/api/root/admin-actions \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

## 5. Test Admin Verification Endpoint

```bash
curl -X POST http://localhost:8084/api/root/verify-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "adminUsername": "admin1",
    "rootUsername": "rootadmin",
    "rootPassword": "rootpass"
  }'
```

## 6. Test Invalid Token (Should return 401)

```bash
curl -X GET http://localhost:8084/api/root/profile \
  -H "Authorization: Bearer invalid-token"
```

## 7. Test No Token (Should return 401)

```bash
curl -X GET http://localhost:8084/api/root/profile
```

## Environment Variables for Testing

You can also set these environment variables:

```bash
export JWT_SECRET=myAdminSecretKeyForBankingAdminService123456789
export JWT_EXPIRATION=86400000
```

Then start your application:

```bash
mvn spring-boot:run
```