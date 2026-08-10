package com.example.admin_service.service;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.admin_service.dto.AdminLoginRequest;
import com.example.admin_service.dto.AdminLoginResponse;
import com.example.admin_service.dto.AdminRegisterRequest;
import com.example.admin_service.dto.ApplicationActionRequest;
import com.example.admin_service.dto.ChangePasswordRequest;
import com.example.admin_service.entity.Admin;
import com.example.admin_service.entity.ApplicationStatus;
import com.example.admin_service.repository.AdminRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final SessionService sessionService;

    @Value("${root.admin.username}")
    private String rootAdminUsername;

    @Value("${root.admin.password}")
    private String rootAdminPassword;

    public ResponseEntity<String> register(AdminRegisterRequest request) {
        if (adminRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists.");
        }
        if (adminRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists.");
        }

        List<Admin> adminsForBank = adminRepository.findByBankname(request.getBankname());
        boolean verifiedAdminExists = adminsForBank.stream().anyMatch(Admin::isVerifiedByRoot);
        if (verifiedAdminExists) {
            return ResponseEntity.badRequest().body("A verified admin already exists for this bank.");
        }

        Admin admin = new Admin();
        admin.setUsername(request.getUsername());
        admin.setEmail(request.getEmail());
        admin.setBankname(request.getBankname());
        admin.setCountry(request.getCountry());
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setVerifiedByRoot(false);
        admin.setApplicationStatus(ApplicationStatus.PENDING);
        admin.setCreatedDate(LocalDateTime.now());
        adminRepository.save(admin);

        emailService.sendWelcomeNotification(
            admin.getEmail(), admin.getUsername(), admin.getBankname(), admin.getCountry()
        );

        return ResponseEntity.ok("Admin registered successfully. Awaiting root verification.");
    }

    public ResponseEntity<AdminLoginResponse> login(AdminLoginRequest request) {
        Admin admin = null;
        if (request.getUsernameOrEmail() != null && !request.getUsernameOrEmail().isEmpty()) {
            admin = adminRepository.findByUsername(request.getUsernameOrEmail())
                    .orElse(adminRepository.findByEmail(request.getUsernameOrEmail()).orElse(null));
        }

        if (admin == null) {
            return ResponseEntity.badRequest().body(new AdminLoginResponse(false, "Invalid credentials.", null, null, null));
        }
        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            return ResponseEntity.badRequest().body(new AdminLoginResponse(false, "Invalid credentials.", null, null, null));
        }

        if (admin.getApplicationStatus() == ApplicationStatus.PENDING) {
            return ResponseEntity.badRequest().body(new AdminLoginResponse(false, "Your application is pending approval.", null, null, null));
        }
        if (admin.getApplicationStatus() == ApplicationStatus.REJECTED) {
            String reason = admin.getRejectionReason() != null && !admin.getRejectionReason().isEmpty()
                    ? " Reason: " + admin.getRejectionReason() : "";
            return ResponseEntity.badRequest().body(new AdminLoginResponse(false, "Your application has been rejected." + reason, null, null, null));
        }

        String jwtToken = jwtService.generateToken(admin.getUsername(), admin.getId(), "ADMIN");
        long expirationTime = jwtService.getExpirationTime();

        return ResponseEntity.ok(new AdminLoginResponse(true, "Login successful.", jwtToken, expirationTime, buildAdminDto(admin)));
    }

    public ResponseEntity<String> verifyAdmin(String username, String incomingRootUsername, String incomingRootPassword) {
        if (!rootAdminUsername.equals(incomingRootUsername) || !rootAdminPassword.equals(incomingRootPassword)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid root admin credentials.");
        }

        Optional<Admin> optionalAdmin = adminRepository.findByUsername(username);
        if (optionalAdmin.isEmpty()) {
            return ResponseEntity.badRequest().body("Admin not found.");
        }

        Admin admin = optionalAdmin.get();
        admin.setVerifiedByRoot(true);
        admin.setApplicationStatus(ApplicationStatus.APPROVED);
        adminRepository.save(admin);

        emailService.sendAccountApprovalNotification(admin.getEmail(), admin.getUsername(), admin.getBankname());
        return ResponseEntity.ok("Admin verified successfully. Approval notification sent.");
    }

    public ResponseEntity<?> updateAdminDetails(Long id, AdminRegisterRequest request) {
        Optional<Admin> optionalAdmin = adminRepository.findById(id);
        if (optionalAdmin.isEmpty()) {
            return ResponseEntity.badRequest().body("Admin not found.");
        }

        Admin admin = optionalAdmin.get();

        if (request.getUsername() != null && !request.getUsername().equals(admin.getUsername())) {
            Optional<Admin> conflict = adminRepository.findByUsername(request.getUsername());
            if (conflict.isPresent() && !conflict.get().getId().equals(id)) {
                return ResponseEntity.badRequest().body("Username already in use.");
            }
            admin.setUsername(request.getUsername());
        }

        if (request.getEmail() != null && !request.getEmail().equals(admin.getEmail())) {
            Optional<Admin> conflict = adminRepository.findByEmail(request.getEmail());
            if (conflict.isPresent() && !conflict.get().getId().equals(id)) {
                return ResponseEntity.badRequest().body("Email already in use.");
            }
            admin.setEmail(request.getEmail());
        }

        if (request.getBankname() != null) {
            admin.setBankname(request.getBankname());
        }

        adminRepository.save(admin);
        return ResponseEntity.ok("Admin details updated successfully.");
    }

    public ResponseEntity<?> updateAdminPassword(Long id, ChangePasswordRequest request) {
        Optional<Admin> optionalAdmin = adminRepository.findById(id);
        if (optionalAdmin.isEmpty()) {
            return ResponseEntity.badRequest().body("Admin not found.");
        }

        Admin admin = optionalAdmin.get();

        if (!passwordEncoder.matches(request.getOldPassword(), admin.getPassword())) {
            return ResponseEntity.badRequest().body("Old password is incorrect.");
        }
        if (passwordEncoder.matches(request.getNewPassword(), admin.getPassword())) {
            return ResponseEntity.badRequest().body("New password must differ from old password.");
        }

        admin.setPassword(passwordEncoder.encode(request.getNewPassword()));
        adminRepository.save(admin);
        return ResponseEntity.ok("Password updated successfully.");
    }

    public ResponseEntity<List<Admin>> getUnverifiedApplications() {
        List<Admin> pendingAdmins = adminRepository.findByApplicationStatus(ApplicationStatus.PENDING);
        return ResponseEntity.ok(pendingAdmins);
    }

    public ResponseEntity<String> approveApplication(Long adminId, ApplicationActionRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String actingAdmin = authentication.getName();

        Optional<Admin> optionalAdmin = adminRepository.findById(adminId);
        if (optionalAdmin.isEmpty()) {
            return ResponseEntity.badRequest().body("Admin not found.");
        }

        Admin admin = optionalAdmin.get();

        if (admin.getApplicationStatus() == ApplicationStatus.APPROVED) {
            return ResponseEntity.badRequest().body("Application is already approved.");
        }
        if (admin.getApplicationStatus() == ApplicationStatus.REJECTED) {
            return ResponseEntity.badRequest().body("Cannot approve a rejected application.");
        }

        List<Admin> adminsForBank = adminRepository.findByBankname(admin.getBankname());
        boolean anotherApproved = adminsForBank.stream()
                .filter(a -> !a.getId().equals(adminId))
                .anyMatch(a -> a.getApplicationStatus() == ApplicationStatus.APPROVED);
        if (anotherApproved) {
            return ResponseEntity.badRequest().body("Another admin for this bank is already verified.");
        }

        admin.setVerifiedByRoot(true);
        admin.setApplicationStatus(ApplicationStatus.APPROVED);
        adminRepository.save(admin);

        emailService.sendAccountApprovalNotification(admin.getEmail(), admin.getUsername(), admin.getBankname());
        return ResponseEntity.ok("Application approved by " + actingAdmin + ". Notification sent.");
    }

    public ResponseEntity<String> rejectApplication(Long adminId, ApplicationActionRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String actingAdmin = authentication.getName();

        Optional<Admin> optionalAdmin = adminRepository.findById(adminId);
        if (optionalAdmin.isEmpty()) {
            return ResponseEntity.badRequest().body("Admin not found.");
        }

        Admin admin = optionalAdmin.get();

        if (admin.getApplicationStatus() == ApplicationStatus.APPROVED) {
            return ResponseEntity.badRequest().body("Cannot reject an already approved application.");
        }
        if (admin.getApplicationStatus() == ApplicationStatus.REJECTED) {
            return ResponseEntity.badRequest().body("Application is already rejected.");
        }

        admin.setApplicationStatus(ApplicationStatus.REJECTED);
        admin.setRejectionReason(request.getReason());
        adminRepository.save(admin);

        emailService.sendAccountRejectionNotification(
            admin.getEmail(), admin.getUsername(), admin.getBankname(), request.getReason()
        );

        return ResponseEntity.ok("Application rejected by " + actingAdmin + ". Notification sent.");
    }

    public ResponseEntity<?> checkApplicationStatus(String usernameOrEmail) {
        Admin admin = adminRepository.findByUsername(usernameOrEmail)
                .orElse(adminRepository.findByEmail(usernameOrEmail).orElse(null));

        if (admin == null) {
            return ResponseEntity.badRequest().body("Admin not found.");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("username", admin.getUsername());
        response.put("email", admin.getEmail());
        response.put("bankname", admin.getBankname());
        response.put("applicationStatus", admin.getApplicationStatus().toString());

        if (admin.getApplicationStatus() == ApplicationStatus.REJECTED) {
            response.put("rejectionReason", admin.getRejectionReason());
        }

        return ResponseEntity.ok(response);
    }

    public ResponseEntity<?> getAdminEmailsByBankName(String bankName) {
        List<Admin> admins = adminRepository.findByBankname(bankName);

        if (admins.isEmpty()) {
            return ResponseEntity.badRequest().body("No admins found for bank: " + bankName);
        }

        List<String> adminEmails = admins.stream()
                .filter(Admin::isVerifiedByRoot)
                .map(Admin::getEmail)
                .collect(Collectors.toList());

        if (adminEmails.isEmpty()) {
            return ResponseEntity.badRequest().body("No verified admins found for bank: " + bankName);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("bankName", bankName);
        response.put("adminEmails", adminEmails);
        response.put("count", adminEmails.size());

        return ResponseEntity.ok(response);
    }

    public ResponseEntity<String> logout(String authHeader) {
        try {
            String token = stripBearer(authHeader);
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.badRequest().body("Invalid token.");
            }
            sessionService.blacklistToken(token);
            return ResponseEntity.ok("Logged out successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Logout failed: " + e.getMessage());
        }
    }

    public ResponseEntity<?> getCurrentAdminDetails() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated.");
            }
            String username = authentication.getName();
            Optional<Admin> optionalAdmin = adminRepository.findByUsername(username);
            if (optionalAdmin.isEmpty()) {
                return ResponseEntity.badRequest().body("Admin not found.");
            }
            return ResponseEntity.ok(buildAdminDto(optionalAdmin.get()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to get admin details: " + e.getMessage());
        }
    }

    // --- Helpers ---

    private String stripBearer(String authHeader) {
        return authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
    }

    private AdminLoginResponse.AdminDto buildAdminDto(Admin admin) {
        return new AdminLoginResponse.AdminDto(
            admin.getId(),
            admin.getUsername(),
            admin.getEmail(),
            admin.getBankname(),
            admin.getCountry(),
            admin.isVerifiedByRoot(),
            admin.getApplicationStatus().toString()
        );
    }
}

