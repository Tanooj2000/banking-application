package com.example.admin_service.controller;

import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.web.bind.annotation.*;

import com.example.admin_service.dto.AdminLoginRequest;
import com.example.admin_service.dto.AdminRegisterRequest;
import com.example.admin_service.entity.Admin;
import com.example.admin_service.service.AdminService;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/register")
    public String register(@RequestBody AdminRegisterRequest request) {
        return adminService.register(request);
    }

    @PostMapping("/login")
    public Map<String, Admin> login(@RequestBody AdminLoginRequest request) {
        return adminService.login(request);
    }

    @PostMapping("/verify")
    public String verifyAdmin(@RequestParam String username,
                              @RequestParam String rootUsername,
                              @RequestParam String rootPassword) {
        return adminService.verifyAdmin(username, rootUsername, rootPassword);
    }
}

