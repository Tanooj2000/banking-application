package com.example.root_admin_service.service;

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
}

