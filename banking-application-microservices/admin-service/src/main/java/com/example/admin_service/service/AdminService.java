package com.example.admin_service.service;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.admin_service.dto.AdminLoginRequest;
import com.example.admin_service.dto.AdminLoginResponse;
import com.example.admin_service.dto.AdminRegisterRequest;
import com.example.admin_service.dto.ChangePasswordRequest;
import com.example.admin_service.entity.Admin;
import com.example.admin_service.entity.ApplicationStatus;
import com.example.admin_service.repository.AdminRepository;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    public ResponseEntity<String> register(AdminRegisterRequest request) {
        if (adminRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }
        if (adminRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }
        
        java.util.List<Admin> adminsForBank = adminRepository.findByBankname(request.getBankname());
        boolean verifiedAdminExists = adminsForBank.stream().anyMatch(Admin::isVerifiedByRoot);
        if (verifiedAdminExists) {
            return ResponseEntity.badRequest().body("Verified Bank Admin already exists");
        }

        Admin admin = new Admin();
        admin.setUsername(request.getUsername());
        admin.setEmail(request.getEmail());
        admin.setBankname(request.getBankname());
        admin.setCountry(request.getCountry());
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setVerifiedByRoot(false); // initially not verified
        admin.setApplicationStatus(ApplicationStatus.PENDING);
        admin.setCreatedDate(java.time.LocalDateTime.now());
        adminRepository.save(admin);

        return ResponseEntity.ok("Admin registered. Awaiting root verification.");
    }

    public ResponseEntity<AdminLoginResponse> login(AdminLoginRequest request) {
        Admin admin = null;
        // Try to find user by username
        if (request.getUsernameOrEmail() != null && !request.getUsernameOrEmail().isEmpty()) {
            admin = adminRepository.findByUsername(request.getUsernameOrEmail()).orElse(null);
            if (admin == null) {
                // Try to find user by email
                admin = adminRepository.findByEmail(request.getUsernameOrEmail()).orElse(null);
            }
        }
        if (admin == null) {
            return ResponseEntity.badRequest().body(new AdminLoginResponse(false, "Admin not found", null));
        }
        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            return ResponseEntity.badRequest().body(new AdminLoginResponse(false, "Invalid credentials", null));
        }
        // Additional validation based on application status
        if (admin.getApplicationStatus() == ApplicationStatus.PENDING) {
            return ResponseEntity.badRequest().body(new AdminLoginResponse(false, "Your application is still pending approval. Please wait for verification.", admin));
        }
        
        if (admin.getApplicationStatus() == ApplicationStatus.REJECTED) {
            String rejectionMessage = "Your application has been rejected.";
            if (admin.getRejectionReason() != null && !admin.getRejectionReason().isEmpty()) {
                rejectionMessage += " Reason: " + admin.getRejectionReason();
            }
            return ResponseEntity.badRequest().body(new AdminLoginResponse(false, rejectionMessage, admin));
        }

        return ResponseEntity.ok(new AdminLoginResponse(true, "Logged in successfully", admin));
    }

    public String verifyAdmin(String username, String rootUsername, String rootPassword) {
        // Hardcoded root admin credentials
        if (!rootUsername.equals("rootadmin") || !rootPassword.equals("rootpass")) {
            return "Invalid root admin credentials.";
        }

        Admin admin = adminRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        admin.setVerifiedByRoot(true);
        adminRepository.save(admin);

        return "Admin verified successfully.";
    }

    // Update admin details
    public ResponseEntity<?> updateAdminDetails(Long id, AdminRegisterRequest request) {
        Admin admin = adminRepository.findById(id).orElse(null);
        if (admin == null) {
            return ResponseEntity.badRequest().body("Admin not found");
        }
        // Update fields (except password and verification)
        admin.setUsername(request.getUsername());
        admin.setEmail(request.getEmail());
        admin.setBankname(request.getBankname());
        adminRepository.save(admin);
        return ResponseEntity.ok("Admin details updated successfully");
    }

    // Update admin password (using ChangePasswordRequest)
    public ResponseEntity<?> updateAdminPassword(Long id, ChangePasswordRequest request) {
        Admin admin = adminRepository.findById(id).orElse(null);
        if (admin == null) {
            return ResponseEntity.badRequest().body("Admin not found");
        }
        if (!passwordEncoder.matches(request.getOldPassword(), admin.getPassword())) {
            return ResponseEntity.badRequest().body("Old password is incorrect");
        }
        if (passwordEncoder.matches(request.getNewPassword(), admin.getPassword())) {
            return ResponseEntity.badRequest().body("New and old password cannot be same");
        }
        admin.setPassword(passwordEncoder.encode(request.getNewPassword()));
        adminRepository.save(admin);
        return ResponseEntity.ok("Password updated successfully");
    }

    // Get all unverified admin applications
    public ResponseEntity<java.util.List<Admin>> getUnverifiedApplications() {
        java.util.List<Admin> pendingAdmins = adminRepository.findByApplicationStatus(ApplicationStatus.PENDING);
        return ResponseEntity.ok(pendingAdmins);
    }

    // Approve admin application
    public ResponseEntity<String> approveApplication(Long adminId, com.example.admin_service.dto.ApplicationActionRequest request) {
        // Validate root admin credentials
        if (!isValidRootAdmin(request.getRootUsername(), request.getRootPassword())) {
            return ResponseEntity.badRequest().body("Invalid root admin credentials.");
        }

        Admin admin = adminRepository.findById(adminId).orElse(null);
        if (admin == null) {
            return ResponseEntity.badRequest().body("Admin not found.");
        }

        if (admin.getApplicationStatus() == ApplicationStatus.APPROVED) {
            return ResponseEntity.badRequest().body("Admin application is already approved.");
        }

        if (admin.getApplicationStatus() == ApplicationStatus.REJECTED) {
            return ResponseEntity.badRequest().body("Cannot approve a rejected application.");
        }

        // Check if another admin for the same bank is already verified
        java.util.List<Admin> adminsForBank = adminRepository.findByBankname(admin.getBankname());
        boolean verifiedAdminExists = adminsForBank.stream()
                .filter(a -> !a.getId().equals(adminId)) // Exclude current admin
                .anyMatch(a -> a.getApplicationStatus() == ApplicationStatus.APPROVED);
        
        if (verifiedAdminExists) {
            return ResponseEntity.badRequest().body("Another admin for this bank is already verified.");
        }

        admin.setVerifiedByRoot(true);
        admin.setApplicationStatus(ApplicationStatus.APPROVED);
        adminRepository.save(admin);

        return ResponseEntity.ok("Admin application approved successfully.");
    }

    // Reject admin application
    public ResponseEntity<String> rejectApplication(Long adminId, com.example.admin_service.dto.ApplicationActionRequest request) {
        // Validate root admin credentials
        if (!isValidRootAdmin(request.getRootUsername(), request.getRootPassword())) {
            return ResponseEntity.badRequest().body("Invalid root admin credentials.");
        }

        Admin admin = adminRepository.findById(adminId).orElse(null);
        if (admin == null) {
            return ResponseEntity.badRequest().body("Admin not found.");
        }

        if (admin.getApplicationStatus() == ApplicationStatus.APPROVED) {
            return ResponseEntity.badRequest().body("Cannot reject an already approved application.");
        }

        if (admin.getApplicationStatus() == ApplicationStatus.REJECTED) {
            return ResponseEntity.badRequest().body("Application is already rejected.");
        }

        // Mark as rejected instead of deleting
        admin.setApplicationStatus(ApplicationStatus.REJECTED);
        admin.setRejectionReason(request.getReason());
        adminRepository.save(admin);

        String reason = request.getReason() != null && !request.getReason().isEmpty() 
                ? " Reason: " + request.getReason() 
                : "";
        
        return ResponseEntity.ok("Admin application rejected successfully." + reason);
    }

    // Check application status by username or email
    public ResponseEntity<?> checkApplicationStatus(String usernameOrEmail) {
        Admin admin = adminRepository.findByUsername(usernameOrEmail)
                .orElse(adminRepository.findByEmail(usernameOrEmail).orElse(null));
        
        if (admin == null) {
            return ResponseEntity.badRequest().body("Admin not found.");
        }
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("username", admin.getUsername());
        response.put("email", admin.getEmail());
        response.put("bankname", admin.getBankname());
        response.put("applicationStatus", admin.getApplicationStatus().toString());
        
        if (admin.getApplicationStatus() == ApplicationStatus.REJECTED) {
            response.put("rejectionReason", admin.getRejectionReason());
        }
        
        return ResponseEntity.ok(response);
    }

    // Helper method to validate root admin credentials
    private boolean isValidRootAdmin(String rootUsername, String rootPassword) {
        return "rootadmin".equals(rootUsername) && "rootpass".equals(rootPassword);
    }
}

