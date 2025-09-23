package com.example.admin_service.service;

import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.admin_service.dto.AdminLoginRequest;
import com.example.admin_service.dto.AdminRegisterRequest;
import com.example.admin_service.entity.Admin;
import com.example.admin_service.repository.AdminRepository;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    public String register(AdminRegisterRequest request) {
        if (adminRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Admin already exists");
        }

        Admin admin = new Admin();
        admin.setUsername(request.getUsername());
        admin.setEmail(request.getEmail());
        admin.setBankname(request.getBankname());
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setVerifiedByRoot(false); // initially not verified
        adminRepository.save(admin);

        return "Admin registered. Awaiting root verification.";
    }

    public Map<String, Admin> login(AdminLoginRequest request) {
        Admin admin = adminRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (!admin.isVerifiedByRoot()) {
            return Map.of("Admin is not verified", admin);
        }

        return Map.of("Logged in sucessfully", admin);
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

