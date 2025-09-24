package com.example.account_service.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.Data;

@Data
public class IndiaAccountRequest {
    public Long userId;
    public String fullName;
    public String aadhaar;
    public String pan;
    public String mobile;
    public String email;
    public LocalDate dob;
    public String gender;
    public String occupation;
    public String address;
    public BigDecimal deposit;
    public boolean consent;
}