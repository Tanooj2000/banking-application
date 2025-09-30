package com.example.account_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import com.example.account_service.dto.IndiaAccountRequest;
import com.example.account_service.dto.UkAccountRequest;
import com.example.account_service.dto.UsaAccountRequest;
import com.example.account_service.entity.Account;

import com.example.account_service.factory.AccountStrategyFactory;
import com.example.account_service.repository.AccountRepository;
import com.example.account_service.stratergy.AccountCreationStrategy;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Service
public class AccountService {
    public void approveAccount(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        if (account.getStatus() != null && account.getStatus().name().equals("PENDING")) {
            account.setStatus(com.example.account_service.entity.AccountStatus.APPROVED);
            accountRepository.save(account);
        } else {
            throw new IllegalArgumentException("Account can only be approved from PENDING status");
        }
    }

    public void rejectAccount(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        if (account.getStatus() != null && account.getStatus().name().equals("PENDING")) {
            account.setStatus(com.example.account_service.entity.AccountStatus.REJECTED);
            accountRepository.save(account);
        } else {
            throw new IllegalArgumentException("Account can only be rejected from PENDING status");
        }
    }

    @Autowired
    private AccountStrategyFactory strategyFactory;

    @Autowired
    private AccountRepository accountRepository;

    public void createAccount(String country, Map<String, Object> payload) {
        AccountCreationStrategy strategy = strategyFactory.getStrategy(country);
        if (strategy == null) {
            throw new IllegalArgumentException("Unsupported country: " + country);
        }

        Object dto = convertPayloadToDto(payload, country);
        strategy.createAccount(dto);
    }

    public List<Account> getAccountsByUserId(Long userId) {
        return accountRepository.findByUserId(userId);
    }

        public List<Account> getAccountsByBankName(String bankName) {
            return accountRepository.findByBank(bankName);
        }

    private Object convertPayloadToDto(Map<String, Object> payload, String country) {
        ObjectMapper mapper = new ObjectMapper();
        switch (country.toUpperCase()) {
            case "IN": return mapper.convertValue(payload, IndiaAccountRequest.class);
            case "US": return mapper.convertValue(payload, UsaAccountRequest.class);
            case "UK": return mapper.convertValue(payload, UkAccountRequest.class);
            default: throw new IllegalArgumentException("Invalid country");
        }
    }
}