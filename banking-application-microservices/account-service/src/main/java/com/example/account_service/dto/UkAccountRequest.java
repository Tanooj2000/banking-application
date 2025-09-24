package com.example.account_service.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UkAccountRequest {
    public Long userId;
    public String fullName;
    public String nationalInsuranceNumber;
    public String mobile;
    public String email;
    public LocalDate dob;
    public String gender;
    public String occupation;
    public String address;
    public BigDecimal deposit;
    public boolean consent;
}
