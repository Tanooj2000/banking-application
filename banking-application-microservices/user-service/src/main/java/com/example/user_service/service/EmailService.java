package com.example.user_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;

    public void sendWelcomeEmail(String toEmail, String username) {
        try {
            log.info("🚀 Starting email send process for user: {} to email: {}", username, toEmail);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Welcome to InterBanking Hub!");
            message.setText(buildWelcomeEmailContent(username));
            message.setFrom("noreplyinterbankinghub@gmail.com");

            log.info("📧 Email message prepared, attempting to send...");
            javaMailSender.send(message);
            log.info("✅ Welcome email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Failed to send welcome email to: {}. Error: {}", toEmail, e.getMessage(), e);
            // Print to console as well for immediate visibility
            System.err.println("❌ EMAIL ERROR: " + e.getMessage());
        }
    }

    private String buildWelcomeEmailContent(String username) {
        return String.format("""
            Dear %s,
            
            Welcome to InterBanking Hub!
            
            Your account has been created successfully. You can now access all our banking services.
            
            Thank you for choosing InterBanking Hub for your banking needs.
            
            Best regards,
            The InterBanking Hub Team
            
            ---
            This is an automated message. Please do not reply to this email.
            """, username);
    }
}