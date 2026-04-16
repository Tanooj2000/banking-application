package com.example.account_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncomeDetails {
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "employment_status", nullable = false)
    private EmploymentStatus employmentStatus;
    
    @Size(max = 200)
    @Column(name = "employer_name", length = 200)
    private String employerName;
    
    @NotBlank
    @Size(min = 2, max = 100)
    @Column(name = "occupation", nullable = false, length = 100)
    private String occupation;
    
    @NotNull
    @DecimalMin(value = "0.0")
    @Digits(integer = 15, fraction = 2)
    @Column(name = "monthly_income", nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyIncome;
    
    @NotNull
    @DecimalMin(value = "0.0")
    @Digits(integer = 15, fraction = 2)
    @Column(name = "annual_income", nullable = false, precision = 15, scale = 2)
    private BigDecimal annualIncome;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "income_source", nullable = false)
    private IncomeSource incomeSource;
    
    @NotBlank
    @Size(min = 3, max = 3)
    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode; // INR, USD, GBP
    
    public enum EmploymentStatus {
        EMPLOYED("Employed"),
        SELF_EMPLOYED("Self-Employed"), 
        BUSINESS("Business"),
        BUSINESS_OWNER("Business Owner"),
        STUDENT("Student"),
        RETIRED("Retired"),
        UNEMPLOYED("Unemployed");
        
        private final String displayName;
        
        EmploymentStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    public enum IncomeSource {
        SALARY("Salary"),
        BUSINESS("Business"),
        INVESTMENT("Investment"), 
        PENSION("Pension"),
        SOCIAL_SECURITY("Social Security"),
        OTHER("Other");
        
        private final String displayName;
        
        IncomeSource(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}