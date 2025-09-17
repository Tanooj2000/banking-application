package com.example.banking_application.service;

import com.example.banking_application.dto.USABankAccountDto;
import java.util.List;

public interface USABankAccountService {
    List<USABankAccountDto> getPendingAccounts();
    USABankAccountDto createAccount(USABankAccountDto dto);
    void approveAccount(Long id);
}
