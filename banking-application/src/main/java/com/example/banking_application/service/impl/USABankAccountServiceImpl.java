package com.example.banking_application.service.impl;

import com.example.banking_application.dto.USABankAccountDto;
import com.example.banking_application.entity.USABankAccount;
import com.example.banking_application.exception.USABankAccountException;
import com.example.banking_application.mapper.USABankAccountMapper;
import com.example.banking_application.repository.USABankAccountRepository;
import com.example.banking_application.service.USABankAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class USABankAccountServiceImpl implements USABankAccountService {

    @Autowired
    private USABankAccountRepository repository;

    @Override
    public List<USABankAccountDto> getPendingAccounts() {
        return repository.findByStatus("pending")
                .stream()
                .map(USABankAccountMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public USABankAccountDto createAccount(USABankAccountDto dto) {
        try {
            USABankAccount entity = USABankAccountMapper.toEntity(dto);
            entity.setStatus("pending");
            USABankAccount saved = repository.save(entity);
            return USABankAccountMapper.toDto(saved);
        } catch (Exception e) {
            throw new USABankAccountException("Failed to create account: " + e.getMessage());
        }
    }

    @Override
    public void approveAccount(Long id) {
        USABankAccount entity = repository.findById(id)
                .orElseThrow(() -> new USABankAccountException("Account not found"));
        entity.setStatus("successful");
        repository.save(entity);
    }
}
