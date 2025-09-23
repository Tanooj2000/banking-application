package com.example.admin_service.dto;

import lombok.Data;

@Data
public class AdminLoginRequest {
    private String username;
    private String password;
}

