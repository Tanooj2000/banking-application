package com.example.root_admin_service.service;

import com.example.root_admin_service.dto.SignInResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class RootAdminService {

    private static final String ROOT_USERNAME = "rootadmin";
    private static final String ROOT_PASSWORD = "rootpass";

    private final RestTemplate restTemplate = new RestTemplate();

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
                log.info("Root admin signed in successfully: {}", username);
                return new SignInResponse(true, "Sign in successful", null);
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

