package com.example.banking_application.service.impl;

import com.example.banking_application.dto.UKBankAccountDto;
import com.example.banking_application.entity.UKBankAccount;
import com.example.banking_application.exception.UKBankAccountException;
import com.example.banking_application.mapper.UKBankAccountMapper;
import com.example.banking_application.repository.UKBankAccountRepository;
import com.example.banking_application.service.UKBankAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UKBankAccountServiceImpl implements UKBankAccountService {

    @Autowired
    private UKBankAccountRepository repository;

    @Override
    public List<UKBankAccountDto> getPendingAccounts() {
        return repository.findByStatus("pending")
                .stream()
                .map(UKBankAccountMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public UKBankAccountDto createAccount(UKBankAccountDto dto) {
        try {
            UKBankAccount entity = UKBankAccountMapper.toEntity(dto);
            entity.setStatus("pending");
            UKBankAccount saved = repository.save(entity);
            return UKBankAccountMapper.toDto(saved);
        } catch (Exception e) {
            throw new UKBankAccountException("Failed to create account: " + e.getMessage());
        }
    }

    @Override
    public void approveAccount(Long id) {
        UKBankAccount entity = repository.findById(id)
                .orElseThrow(() -> new UKBankAccountException("Account not found"));
        entity.setStatus("successful");
        repository.save(entity);
    }
}
