package com.example.banking_application.controller;

import com.example.banking_application.dto.UKBankAccountDto;
import com.example.banking_application.exception.UKBankAccountException;
import com.example.banking_application.service.UKBankAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ukbankaccounts")
public class UKBankAccountController {

    @Autowired
    private UKBankAccountService service;

    @GetMapping("/pending")
    public List<UKBankAccountDto> getPendingAccounts() {
        return service.getPendingAccounts();
    }

    @PostMapping
    public ResponseEntity<?> createAccount(@RequestBody UKBankAccountDto dto) {
        try {
            dto.setStatus("pending");
            UKBankAccountDto saved = service.createAccount(dto);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            throw new UKBankAccountException("Failed to create account: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveAccount(@PathVariable Long id) {
        service.approveAccount(id);
        return ResponseEntity.ok("Account approved");
    }
}
