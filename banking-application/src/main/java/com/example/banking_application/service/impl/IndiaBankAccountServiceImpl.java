package com.example.banking_application.service.impl;

import com.example.banking_application.dto.IndiaBankAccountDto;
import com.example.banking_application.entity.IndiaBankAccount;
import com.example.banking_application.exception.IndiaBankAccountException;
import com.example.banking_application.mapper.IndiaBankAccountMapper;
import com.example.banking_application.repository.IndiaBankAccountRepository;
import com.example.banking_application.service.IndiaBankAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class IndiaBankAccountServiceImpl implements IndiaBankAccountService {

    @Autowired
    private IndiaBankAccountRepository repository;

    @Override
    public List<IndiaBankAccountDto> getPendingAccounts() {
        return repository.findByStatus("pending")
                .stream()
                .map(IndiaBankAccountMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public IndiaBankAccountDto createAccount(IndiaBankAccountDto dto) {
        try {
            IndiaBankAccount entity = IndiaBankAccountMapper.toEntity(dto);
            entity.setStatus("pending");
            IndiaBankAccount saved = repository.save(entity);
            return IndiaBankAccountMapper.toDto(saved);
        } catch (Exception e) {
            throw new IndiaBankAccountException("Failed to create account: " + e.getMessage());
        }
    }

    @Override
    public void approveAccount(Long id) {
        IndiaBankAccount entity = repository.findById(id)
                .orElseThrow(() -> new IndiaBankAccountException("Account not found"));
        entity.setStatus("successful");
        repository.save(entity);
    }
}
