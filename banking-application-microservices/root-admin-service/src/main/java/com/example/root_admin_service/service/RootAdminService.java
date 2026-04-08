package com.example.root_admin_service.service;

import com.example.root_admin_service.dto.SignInResponse;
import com.example.root_admin_service.enums.Role;
import com.example.root_admin_service.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class RootAdminService {

    private static final String ROOT_USERNAME = "rootadmin";
    private static final String ROOT_PASSWORD = "rootpass";

    private final RestTemplate restTemplate;
    private final JwtUtil jwtUtil;

    public String verifyAdmin(String adminUsername, String rootUsername, String rootPassword) {
        if (!ROOT_USERNAME.equals(rootUsername) || !ROOT_PASSWORD.equals(rootPassword)) {
            return "Invalid root admin credentials.";
        }

        String adminServiceUrl = "http://localhost:8083/api/admin/verify?username=" + adminUsername +
                "&rootUsername=" + rootUsername + "&rootPassword=" + rootPassword;

        try {
            String response = restTemplate.postForObject(adminServiceUrl, null, String.class);
            return response;
        } catch (Exception e) {
            log.error("Error verifying admin: {}", e.getMessage());
            return "Failed to verify admin.";
        }
    }

    public SignInResponse signIn(String username, String password) {
        try {
            // Check if credentials match the root admin credentials
            if (ROOT_USERNAME.equals(username) && ROOT_PASSWORD.equals(password)) {
                // Generate JWT token with ROOT_ADMIN role
                String role = Role.ROOT_ADMIN.getAuthority();
                String token = jwtUtil.generateToken(username, role);
                
                log.info("Root admin signed in successfully: {}", username);
                return new SignInResponse(true, "Sign in successful", token);
            } else {
                log.warn("Invalid sign in attempt for username: {}", username);
                return new SignInResponse(false, "Invalid username or password", null);
            }
        } catch (Exception e) {
            log.error("Error during sign in: {}", e.getMessage());
            return new SignInResponse(false, "Sign in failed due to server error", null);
        }
    }
}

