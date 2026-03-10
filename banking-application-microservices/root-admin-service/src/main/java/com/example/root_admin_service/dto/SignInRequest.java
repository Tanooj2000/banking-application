package com.example.root_admin_service.dto;

import lombok.Data;

@Data
public class SignInRequest {
    private String username;
    private String password;
}