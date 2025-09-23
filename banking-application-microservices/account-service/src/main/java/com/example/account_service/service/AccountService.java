package com.example.account_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.example.account_service.dto.AccountRequest;
import com.example.account_service.entity.Account;
import com.example.account_service.entity.AccountStatus;
import com.example.account_service.repository.AccountRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;

    public String createAccount(AccountRequest request) {
        Account account = new Account();
        account.setUsername(request.getUsername());
        account.setBankName(request.getBankName());
        account.setAccountType(request.getAccountType());
        account.setStatus(AccountStatus.PENDING);
        accountRepository.save(account);
        return "Account request submitted.";
    }

    public List<Account> getPendingAccounts() {
        return accountRepository.findByStatus(AccountStatus.PENDING);
    }

    public String approveAccount(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        account.setStatus(AccountStatus.APPROVED);
        accountRepository.save(account);
        return "Account approved.";
    }

    public String rejectAccount(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        account.setStatus(AccountStatus.REJECTED);
        accountRepository.save(account);
        return "Account rejected.";
    }
}

