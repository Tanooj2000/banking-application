package com.example.account_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.example.account_service.entity.Account;

import java.util.List;

@Service
public class EmailNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(EmailNotificationService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private AdminService adminService;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Sends email notification to bank admin when a new account is created
     * @param account The newly created account
     */
    public void notifyAdminAccountCreated(Account account) {
        if (account == null || account.getBank() == null) {
            logger.warn("Cannot send notification - account or bank information is null");
            return;
        }

        try {
            // Validate from email
            if (fromEmail == null || fromEmail.trim().isEmpty()) {
                logger.error("FROM email is not configured properly: {}", fromEmail);
                return;
            }
            logger.info("Using FROM email: {}", fromEmail);
            
            // Fetch admin email for the specific bank
            List<String> adminEmails = adminService.getAdminEmailsByBank(account.getBank());
            
            if (adminEmails.isEmpty()) {
                logger.warn("No admin email found for bank: {}. Notification not sent.", account.getBank());
                return;
            }

            // Send email to admin
            String adminEmail = adminEmails.get(0);
            
            // Validate admin email
            if (adminEmail == null || adminEmail.trim().isEmpty() || !adminEmail.contains("@")) {
                logger.error("Invalid admin email received: '{}' for bank: {}", adminEmail, account.getBank());
                return;
            }
            
            logger.info("Sending email FROM: {} TO: {}", fromEmail, adminEmail);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail.trim());
            message.setTo(adminEmail.trim());
            message.setSubject("New Account Application - " + account.getBank());
            message.setText(buildNotificationMessage(account));
            
            mailSender.send(message);
            logger.info("Account creation notification sent to: {} for account ID: {}", 
                       adminEmail, account.getId());

        } catch (Exception e) {
            logger.error("Failed to send account creation notification for account ID: {}. Error: {}", 
                        account.getId(), e.getMessage());
        }
    }

    /**
     * Sends email notification to account holder when account is approved
     * @param account The approved account
     */
    public void notifyAccountApproved(Account account) {
        if (account == null || account.getEmail() == null) {
            logger.warn("Cannot send approval notification - account or email information is null");
            return;
        }

        try {
            if (fromEmail == null || fromEmail.trim().isEmpty()) {
                logger.error("FROM email is not configured properly: {}", fromEmail);
                return;
            }

            // Validate account holder email
            String accountEmail = account.getEmail().trim();
            if (accountEmail.isEmpty() || !accountEmail.contains("@")) {
                logger.error("Invalid account holder email: '{}' for account ID: {}", accountEmail, account.getId());
                return;
            }

            logger.info("Sending approval notification FROM: {} TO: {}", fromEmail, accountEmail);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail.trim());
            message.setTo(accountEmail);
            message.setSubject("Account Approved - " + account.getBank());
            message.setText(buildApprovalMessage(account));

            mailSender.send(message);
            logger.info("Account approval notification sent to: {} for account ID: {}", 
                       accountEmail, account.getId());

        } catch (Exception e) {
            logger.error("Failed to send account approval notification for account ID: {}. Error: {}", 
                        account.getId(), e.getMessage());
        }
    }

    /**
     * Sends email notification to account holder when account is rejected
     * @param account The rejected account
     */
    public void notifyAccountRejected(Account account) {
        if (account == null || account.getEmail() == null) {
            logger.warn("Cannot send rejection notification - account or email information is null");
            return;
        }

        try {
            if (fromEmail == null || fromEmail.trim().isEmpty()) {
                logger.error("FROM email is not configured properly: {}", fromEmail);
                return;
            }

            // Validate account holder email
            String accountEmail = account.getEmail().trim();
            if (accountEmail.isEmpty() || !accountEmail.contains("@")) {
                logger.error("Invalid account holder email: '{}' for account ID: {}", accountEmail, account.getId());
                return;
            }

            logger.info("Sending rejection notification FROM: {} TO: {}", fromEmail, accountEmail);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail.trim());
            message.setTo(accountEmail);
            message.setSubject("Account Application Status - " + account.getBank());
            message.setText(buildRejectionMessage(account));

            mailSender.send(message);
            logger.info("Account rejection notification sent to: {} for account ID: {}", 
                       accountEmail, account.getId());

        } catch (Exception e) {
            logger.error("Failed to send account rejection notification for account ID: {}. Error: {}", 
                        account.getId(), e.getMessage());
        }
    }

    private String buildNotificationMessage(Account account) {
        return String.format(
            "Dear Admin,\n\n" +
            "You got a new account application. Please check it.\n\n" +
            "Applicant: %s\n" +
            "Bank: %s\n" +
            "Account ID: %s\n\n" +
            "Please review and approve/reject the application.\n\n" +
            "Best regards,\n" +
            "Banking System",
            account.getFullName(),
            account.getBank(),
            account.getId()
        );
    }

    private String buildApprovalMessage(Account account) {
        return String.format(
            "Dear %s,\n\n" +
            "Congratulations! Your account application has been approved.\n\n" +
            "Account Details:\n" +
            "Account Number: %s\n" +
            "Bank: %s\n" +
            "Branch: %s\n" +
            "Account Holder: %s\n\n" +
            "You can now start using your account for banking services.\n\n" +
            "Thank you for choosing our banking services.\n\n" +
            "Best regards,\n" +
            "Banking System",
            account.getFullName(),
            account.getAccountNumber(),
            account.getBank(),
            account.getBranch(),
            account.getFullName()
        );
    }

    private String buildRejectionMessage(Account account) {
        return String.format(
            "Dear %s,\n\n" +
            "We regret to inform you that your account application has been rejected.\n\n" +
            "Application Details:\n" +
            "Bank: %s\n" +
            "Branch: %s\n" +
            "Application ID: %s\n\n" +
            "Please contact our customer service for more information or to reapply.\n\n" +
            "Thank you for your interest in our banking services.\n\n" +
            "Best regards,\n" +
            "Banking System",
            account.getFullName(),
            account.getBank(),
            account.getBranch(),
            account.getId()
        );
    }
}