package com.example.root_admin_service.dto;

import lombok.Data;

@Data
public class AdminVerificationRequest {
    private String adminUsername;
    private String rootUsername;
    private String rootPassword;
}

