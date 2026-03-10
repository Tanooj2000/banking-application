package com.example.admin_service.entity;

public enum ApplicationStatus {
    PENDING,    // Application submitted, awaiting review
    APPROVED,   // Application approved by root admin
    REJECTED    // Application rejected by root admin
}