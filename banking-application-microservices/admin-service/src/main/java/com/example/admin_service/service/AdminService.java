package com.example.admin_service.service;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.admin_service.dto.AdminLoginRequest;
import com.example.admin_service.dto.AdminLoginResponse;
import com.example.admin_service.dto.AdminRegisterRequest;
import com.example.admin_service.entity.Admin;
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
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setVerifiedByRoot(false); // initially not verified
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
        if (!admin.isVerifiedByRoot()) {
            return ResponseEntity.badRequest().body(new AdminLoginResponse(false, "Admin is not verified please wait for some time and try again", admin));
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
}

