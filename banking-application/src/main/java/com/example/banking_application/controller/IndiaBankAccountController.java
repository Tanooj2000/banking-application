package com.example.banking_application.controller;

import com.example.banking_application.dto.IndiaBankAccountDto;
import com.example.banking_application.exception.IndiaBankAccountException;
import com.example.banking_application.service.IndiaBankAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/indiabankaccounts")
public class IndiaBankAccountController {

    @Autowired
    private IndiaBankAccountService service;

    @GetMapping("/pending")
    public List<IndiaBankAccountDto> getPendingAccounts() {
        return service.getPendingAccounts();
    }

    @PostMapping
    public ResponseEntity<?> createAccount(@RequestBody IndiaBankAccountDto dto) {
        try {
            dto.setStatus("pending");
            IndiaBankAccountDto saved = service.createAccount(dto);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            throw new IndiaBankAccountException("Failed to create account: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveAccount(@PathVariable Long id) {
        service.approveAccount(id);
        return ResponseEntity.ok("Account approved");
    }
}
