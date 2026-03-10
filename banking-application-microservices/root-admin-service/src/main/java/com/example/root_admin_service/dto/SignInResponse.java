package com.example.root_admin_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SignInResponse {
    private boolean success;
    private String message;
    private String token; // Optional: for JWT token if implementing token-based auth
}