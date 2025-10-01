package com.example.admin_service.dto;

import lombok.Data;

@Data
public class AdminRegisterRequest {
    private String username;
    private String email;
    private String bankname;
    private String country;
    private String password;
}

