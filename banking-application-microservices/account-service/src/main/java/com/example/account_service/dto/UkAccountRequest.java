package com.example.account_service.dto;

import lombok.Data;
import java.math.BigDecimal;
import com.example.account_service.entity.AccountStatus;
import com.example.account_service.entity.AccountType;
import com.fasterxml.jackson.annotation.JsonFormat;
@Data
public class UkAccountRequest {
    private Long userId;
    private String fullName;
    private String nin;
    private String mobile;
    private String email;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private String dob;
    private String gender;
    private String occupation;
    private String address;
    private BigDecimal deposit;
    private boolean consent;
    private AccountType accountType;
    private AccountStatus status;
}
