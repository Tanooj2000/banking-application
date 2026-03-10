package com.example.admin_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationActionRequest {
    private String rootUsername;
    private String rootPassword;
    private String reason; // Optional reason for approval/rejection
}