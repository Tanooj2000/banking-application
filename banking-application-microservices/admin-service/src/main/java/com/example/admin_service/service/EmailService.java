package com.example.admin_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendWelcomeNotification(String toEmail, String username, String bankName, String country) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Welcome to Admin Banking Hub - Registration Successful");
            
            String emailContent = buildWelcomeEmailContent(username, bankName, country);
            message.setText(emailContent);
            
            mailSender.send(message);
            log.info("Welcome email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}. Error: {}", toEmail, e.getMessage());
        }
    }

    private String buildWelcomeEmailContent(String username, String bankName, String country) {
        return String.format(
            "Dear %s,\n\n" +
            "Welcome to Admin Banking Hub!\n\n" +
            "Thank you for registering as an administrator for %s in %s. " +
            "Your registration has been successfully submitted and is currently under review by our root administrators.\n\n" +
            "Registration Details:\n" +
            "- Username: %s\n" +
            "- Bank: %s\n" +
            "- Country: %s\n" +
            "- Status: Pending Verification\n\n" +
            "Please note that your account will be activated once it has been verified by our root administrators. " +
            "You will receive another notification once your account has been approved and is ready to use.\n\n" +
            "If you have any questions or concerns, please feel free to contact our support team.\n\n" +
            "Best regards,\n" +
            "Admin Banking Hub Team\n\n" +
            "Note: This is an automated email. Please do not reply to this message.",
            username, bankName, country, username, bankName, country
        );
    }

    public void sendAccountApprovalNotification(String toEmail, String username, String bankName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Account Approved - Welcome to Admin Banking Hub");
            
            String emailContent = String.format(
                "Dear %s,\n\n" +
                "Congratulations! Your administrator account for %s has been approved and activated.\n\n" +
                "You can now log in to your account using your registered credentials and start managing " +
                "your banking operations through our Admin Banking Hub.\n\n" +
                "Thank you for choosing our platform.\n\n" +
                "Best regards,\n" +
                "Admin Banking Hub Team",
                username, bankName
            );
            message.setText(emailContent);
            
            mailSender.send(message);
            log.info("Account approval email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send approval email to: {}. Error: {}", toEmail, e.getMessage());
        }
    }

    public void sendAccountRejectionNotification(String toEmail, String username, String bankName, String rejectionReason) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Application Status Update - Admin Banking Hub");
            
            String reasonText = (rejectionReason != null && !rejectionReason.isEmpty()) 
                ? "\n\nReason for rejection: " + rejectionReason
                : "";
            
            String emailContent = String.format(
                "Dear %s,\n\n" +
                "We regret to inform you that your administrator application for %s has been rejected by our review team.%s\n\n" +
                "If you believe this decision was made in error or if you would like to address the concerns raised, " +
                "please feel free to contact our support team for further assistance.\n\n" +
                "You may also resubmit your application after addressing any issues mentioned above.\n\n" +
                "Thank you for your interest in Admin Banking Hub.\n\n" +
                "Best regards,\n" +
                "Admin Banking Hub Team",
                username, bankName, reasonText
            );
            message.setText(emailContent);
            
            mailSender.send(message);
            log.info("Account rejection email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send rejection email to: {}. Error: {}", toEmail, e.getMessage());
        }
    }
}