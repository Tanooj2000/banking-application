package com.example.banking_application.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UKBankAccountDto {
    private Long id;
    private String fullName;
    private String nin;
    private String phone;
    private String email;
    private LocalDate dob;
    private String gender;
    private String occupation;
    private String address;
    private String idProofType;
    private Double deposit;
    private Boolean consent;
    private String bank;
    private String country;
    private String status;
}
