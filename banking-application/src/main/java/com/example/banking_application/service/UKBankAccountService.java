package com.example.banking_application.service;

import com.example.banking_application.dto.UKBankAccountDto;
import java.util.List;

public interface UKBankAccountService {
    List<UKBankAccountDto> getPendingAccounts();
    UKBankAccountDto createAccount(UKBankAccountDto dto);
    void approveAccount(Long id);
}
