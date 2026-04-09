package com.example.admin_service.controller;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.example.admin_service.dto.AdminLoginRequest;
import com.example.admin_service.dto.AdminLoginResponse;
import com.example.admin_service.dto.AdminRegisterRequest;
import com.example.admin_service.dto.ApplicationActionRequest;
import com.example.admin_service.dto.ChangePasswordRequest;
import com.example.admin_service.service.AdminService;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody AdminRegisterRequest request) {
        return adminService.register(request);
    }

    @PostMapping("/login")
    public ResponseEntity<AdminLoginResponse> login(@RequestBody AdminLoginRequest request) {
        return adminService.login(request);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String token) {
        return adminService.logout(token);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentAdminDetails(@RequestHeader("Authorization") String token) {
        return adminService.getCurrentAdminDetails(token);
    }

    @PostMapping("/verify")
    public String verifyAdmin(@RequestParam String username,
                              @RequestParam String rootUsername,
                              @RequestParam String rootPassword) {
        return adminService.verifyAdmin(username, rootUsername, rootPassword);
    }

    // Update admin details
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAdminDetails(@PathVariable Long id, @RequestBody AdminRegisterRequest request) {
        return adminService.updateAdminDetails(id, request);
    }

    // Update admin password (using request body)
    @PutMapping("/{id}/password")
    public ResponseEntity<?> updateAdminPassword(
            @PathVariable Long id,
            @RequestBody ChangePasswordRequest request) {
        return adminService.updateAdminPassword(id, request);
    }

    // Get all applications that are not verified by root-admin (ROOT ADMIN ONLY)
    @GetMapping("/applications/pending")
    @PreAuthorize("hasRole('ROOT_ADMIN')")
    public ResponseEntity<java.util.List<com.example.admin_service.entity.Admin>> getUnverifiedApplications() {
        return adminService.getUnverifiedApplications();
    }

    // Approve admin application (ROOT ADMIN ONLY)
    @PostMapping("/applications/{adminId}/approve")
    @PreAuthorize("hasRole('ROOT_ADMIN')")
    public ResponseEntity<String> approveApplication(
            @PathVariable Long adminId,
            @RequestBody ApplicationActionRequest request) {
        return adminService.approveApplication(adminId, request);
    }

    // Reject admin application (ROOT ADMIN ONLY)
    @PostMapping("/applications/{adminId}/reject")
    @PreAuthorize("hasRole('ROOT_ADMIN')")
    public ResponseEntity<String> rejectApplication(
            @PathVariable Long adminId,
            @RequestBody ApplicationActionRequest request) {
        return adminService.rejectApplication(adminId, request);
    }

    // Check application status
    @GetMapping("/application-status")
    public ResponseEntity<?> checkApplicationStatus(@RequestParam String usernameOrEmail) {
        return adminService.checkApplicationStatus(usernameOrEmail);
    }

    // Get admin emails by bank name
    @GetMapping("/emails/by-bank")
    public ResponseEntity<?> getAdminEmailsByBankName(@RequestParam String bankName) {
        return adminService.getAdminEmailsByBankName(bankName);
    }
}

