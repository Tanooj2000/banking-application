package com.example.admin_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.example.admin_service.dto.AdminLoginRequest;
import com.example.admin_service.dto.AdminLoginResponse;
import com.example.admin_service.dto.AdminRegisterRequest;
import com.example.admin_service.dto.ApplicationActionRequest;
import com.example.admin_service.dto.ChangePasswordRequest;
import com.example.admin_service.entity.Admin;
import com.example.admin_service.service.AdminService;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody AdminRegisterRequest request) {
        return adminService.register(request);
    }

    @PostMapping("/login")
    public ResponseEntity<AdminLoginResponse> login(@Valid @RequestBody AdminLoginRequest request) {
        return adminService.login(request);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String token) {
        return adminService.logout(token);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentAdminDetails() {
        return adminService.getCurrentAdminDetails();
    }

    @PostMapping("/verify")
    public ResponseEntity<String> verifyAdmin(@RequestParam String username,
                                              @RequestParam String rootUsername,
                                              @RequestParam String rootPassword) {
        return adminService.verifyAdmin(username, rootUsername, rootPassword);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAdminDetails(@PathVariable Long id, @Valid @RequestBody AdminRegisterRequest request) {
        return adminService.updateAdminDetails(id, request);
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<?> updateAdminPassword(@PathVariable Long id, @Valid @RequestBody ChangePasswordRequest request) {
        return adminService.updateAdminPassword(id, request);
    }

    @GetMapping("/applications/pending")
    @PreAuthorize("hasRole('ROOT_ADMIN')")
    public ResponseEntity<List<Admin>> getUnverifiedApplications() {
        return adminService.getUnverifiedApplications();
    }

    @PostMapping("/applications/{adminId}/approve")
    @PreAuthorize("hasRole('ROOT_ADMIN')")
    public ResponseEntity<String> approveApplication(@PathVariable Long adminId,
                                                     @RequestBody ApplicationActionRequest request) {
        return adminService.approveApplication(adminId, request);
    }

    @PostMapping("/applications/{adminId}/reject")
    @PreAuthorize("hasRole('ROOT_ADMIN')")
    public ResponseEntity<String> rejectApplication(@PathVariable Long adminId,
                                                    @RequestBody ApplicationActionRequest request) {
        return adminService.rejectApplication(adminId, request);
    }

    @GetMapping("/application-status")
    public ResponseEntity<?> checkApplicationStatus(@RequestParam String usernameOrEmail) {
        return adminService.checkApplicationStatus(usernameOrEmail);
    }

    @GetMapping("/emails/by-bank")
    public ResponseEntity<?> getAdminEmailsByBankName(@RequestParam String bankName) {
        return adminService.getAdminEmailsByBankName(bankName);
    }
}


