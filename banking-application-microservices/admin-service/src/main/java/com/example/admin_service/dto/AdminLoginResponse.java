package com.example.admin_service.dto;

import com.example.admin_service.entity.Admin;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminLoginResponse {
    private boolean success;
    private String message;
    private Admin admin;
}
