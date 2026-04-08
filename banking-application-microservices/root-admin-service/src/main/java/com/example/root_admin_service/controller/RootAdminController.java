package com.example.root_admin_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.root_admin_service.dto.AdminVerificationRequest;
import com.example.root_admin_service.dto.SignInRequest;
import com.example.root_admin_service.dto.SignInResponse;
import com.example.root_admin_service.service.RootAdminService;
import com.example.root_admin_service.util.SecurityUtil;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/root")
@RequiredArgsConstructor
public class RootAdminController {

    private final RootAdminService rootAdminService;
    private final SecurityUtil securityUtil;

    @PostMapping("/verify-admin")
    @PreAuthorize("hasRole('ROOT_ADMIN')")
    public String verifyAdmin(@RequestBody AdminVerificationRequest request) {
        return rootAdminService.verifyAdmin(
                request.getAdminUsername(),
                request.getRootUsername(),
                request.getRootPassword()
        );
    }

    @PostMapping("/signin")
    public SignInResponse signIn(@RequestBody SignInRequest request) {
        return rootAdminService.signIn(
                request.getUsername(),
                request.getPassword()
        );
    }

    // SIMPLE TEST API FOR JWT DEBUGGING
    @GetMapping("/test-jwt")
    @PreAuthorize("hasRole('ROOT_ADMIN')")
    public ResponseEntity<Map<String, Object>> testJwt() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "JWT Authentication successful!");
        response.put("user", securityUtil.getCurrentUsername());
        response.put("roles", securityUtil.getCurrentUserRoles());
        response.put("timestamp", java.time.LocalDateTime.now());
        return ResponseEntity.ok(response);
    }

    
}

