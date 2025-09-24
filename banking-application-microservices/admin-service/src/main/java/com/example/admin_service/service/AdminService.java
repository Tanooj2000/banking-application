package com.example.admin_service.service;

import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.apache.catalina.connector.Response;
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

    public Map<String, Object> login(AdminLoginRequest request) {
        Admin admin = adminRepository.findByUsername(request.getUsername())
                .orElse(null);
        if (admin == null) {
            return Map.of("success", false, "message", "Admin not found", "admin", null);
        }
        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            return Map.of("success", false, "message", "Invalid credentials", "admin", null);
        }
        if (!admin.isVerifiedByRoot()) {
            return Map.of("success", false, "message", "Admin is not verified", "admin", admin);
        }

        return Map.of("success", true, "message", "Logged in successfully", "admin", admin);
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

