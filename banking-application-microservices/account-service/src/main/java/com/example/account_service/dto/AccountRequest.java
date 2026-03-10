package com.example.account_service.dto;

import com.example.account_service.entity.AccountType;

import lombok.*;

@Data
public class AccountRequest {
    private String username;
    private String bankName;
    private AccountType accountType;
}

