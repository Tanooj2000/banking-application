package com.example.root_admin_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.example.root_admin_service.dto.AdminVerificationRequest;
import com.example.root_admin_service.service.RootAdminService;

@RestController
@RequestMapping("/api/root")
@RequiredArgsConstructor
public class RootAdminController {

    private final RootAdminService rootAdminService;

    @PostMapping("/verify-admin")
    public String verifyAdmin(@RequestBody AdminVerificationRequest request) {
        return rootAdminService.verifyAdmin(
                request.getAdminUsername(),
                request.getRootUsername(),
                request.getRootPassword()
        );
    }
}

