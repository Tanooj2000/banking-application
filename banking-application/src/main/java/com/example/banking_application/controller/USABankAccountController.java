package com.example.banking_application.controller;

import com.example.banking_application.dto.USABankAccountDto;
import com.example.banking_application.exception.USABankAccountException;
import com.example.banking_application.service.USABankAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/usabankaccounts")
public class USABankAccountController {

    @Autowired
    private USABankAccountService service;

    @GetMapping("/pending")
    public List<USABankAccountDto> getPendingAccounts() {
        return service.getPendingAccounts();
    }

    @PostMapping
    public ResponseEntity<?> createAccount(@RequestBody USABankAccountDto dto) {
        try {
            dto.setStatus("pending");
            USABankAccountDto saved = service.createAccount(dto);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            throw new USABankAccountException("Failed to create account: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveAccount(@PathVariable Long id) {
        service.approveAccount(id);
        return ResponseEntity.ok("Account approved");
    }
}
