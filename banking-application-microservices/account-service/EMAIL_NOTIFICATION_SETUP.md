# Email Notification Setup Guide

## Overview
The banking application now supports automatic email notifications to bank administrators when:
1. A new account is created
2. Account status is updated (approved/rejected)

## Configuration

### 1. Email Configuration
Update your `application.yml` with your email settings:

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${MAIL_USERNAME:your-email@gmail.com}
    password: ${MAIL_PASSWORD:your-app-password}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
```

### 2. Environment Variables
Set the following environment variables or modify application.yml:

- `MAIL_USERNAME`: Your email address (e.g., your-app@gmail.com)
- `MAIL_PASSWORD`: Your app password (not regular password for Gmail)

### 3. Admin Service Configuration
Ensure your admin microservice is running on `http://localhost:8080` and provides the endpoint:
```
GET /api/admin/emails/by-bank?bankName={bankName}
```

## Features

### Automatic Notifications
- **Account Creation**: When a user creates an account, all admins for that bank receive an email notification
- **Status Updates**: When accounts are approved or rejected, admins receive status update emails

### Email Content
The notification emails include:
- Complete account details
- Action required information
- Bank-specific admin targeting
- Formatted, professional email templates

### Error Handling
- Failed notifications don't interrupt the account creation process
- Comprehensive logging for troubleshooting
- Graceful fallback when admin service is unavailable

## Usage

### Creating an Account
```http
POST /api/accounts/create/{country}
Content-Type: application/json

{
  "userId": 123,
  "bank": "HDFC Bank",
  "branch": "Main Branch",
  "fullName": "John Doe",
  "email": "john@example.com",
  // ... other fields
}
```

The system will:
1. Create the account
2. Fetch admin emails for "HDFC Bank" from admin service
3. Send notification emails to all bank admins
4. Return success response with notification confirmation

### Approving/Rejecting Accounts
```http
POST /api/accounts/approve/{accountId}
POST /api/accounts/reject/{accountId}
```

Bank admins will receive status update notifications automatically.

## Troubleshooting

### Check Logs
Monitor the application logs for:
- Email sending status
- Admin service connectivity
- Notification delivery confirmations

### Common Issues
1. **Admin Service Unavailable**: Check if admin service is running on port 8080
2. **Email Not Sending**: Verify SMTP settings and credentials
3. **No Admin Emails Found**: Ensure admin service returns valid emails for the bank

### Test the System
1. Ensure admin microservice is running
2. Configure email settings
3. Create a test account
4. Check email delivery and logs

## Dependencies Added
- `spring-boot-starter-mail`: For email functionality
- `spring-boot-starter-webflux`: For HTTP client calls to admin service

## Services Created
- **EmailNotificationService**: Handles email sending and formatting
- **AdminService**: Communicates with admin microservice
- **WebClientConfig**: Configuration for HTTP client

The notification system is designed to be robust and non-intrusive, ensuring that account operations continue even if notifications fail.