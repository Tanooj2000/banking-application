package com.example.user_service.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String email;
    private long phonenumber;
    private String password;
}

