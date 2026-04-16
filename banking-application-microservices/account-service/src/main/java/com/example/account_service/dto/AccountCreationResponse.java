package com.example.account_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.example.account_service.entity.AccountStatus;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountCreationResponse {
    
    private String accountNumber; // Only set after approval
    private String applicationId; // Always set for tracking
    private String userId;
    private AccountStatus status;
    private String country;
    private LocalDateTime createdDate;
    
    // Validation results for each section
    private Map<String, ValidationResult> validationResults;
    
    // Document requirements
    private List<String> requiredDocuments;
    
    // Application progress
    private String applicationStage;
    private Double completionPercentage;
    
    // Messages
    private String message;
    private List<String> warnings;
    private List<String> nextSteps;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidationResult {
        private boolean isValid;
        private List<String> errors;
        private List<String> warnings;
    }
}