package com.example.bank_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import com.example.bank_service.entity.Bank;
import com.example.bank_service.service.BankService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/banks")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
@Validated
public class BankController {

    private final BankService bankService;

    @GetMapping("/country/{country}")
    public List<Bank> getBanksByCountry(@PathVariable String country) {
        return bankService.getBanksByCountry(country);
    }

    @GetMapping("/country/{country}/city/{city}")
    public List<Bank> getBanksByCountryAndCity(@PathVariable String country, @PathVariable String city) {
        return bankService.getBanksByCountryAndCity(country, city);
    }

    // Original add bank endpoint
    @PostMapping("/add")
    public ResponseEntity<?> addBank(@RequestBody Bank bank) {
        return bankService.addBankWithValidation(bank);
    }

    // Add multiple banks in bulk
    @PostMapping("/bulk-add")
    public ResponseEntity<?> addBanksBulk(@RequestBody @NotEmpty List<Bank> banks) {
        return bankService.addBanksBulk(banks);
    }

    // Add bank with enhanced validation
    @PostMapping("/add-enhanced")
    public ResponseEntity<?> addBankEnhanced(@Valid @RequestBody Bank bank) {
        return bankService.addBankWithEnhancedValidation(bank);
    }

    // Validate bank data without saving
    @PostMapping("/validate")
    public ResponseEntity<?> validateBank(@RequestBody Bank bank) {
        return bankService.validateBankData(bank);
    }

    // Check if bank code is available
    @GetMapping("/check-code/{code}")
    public ResponseEntity<Map<String, Boolean>> checkBankCodeAvailability(@PathVariable String code) {
        boolean isAvailable = bankService.isBankCodeAvailable(code);
        return ResponseEntity.ok(Map.of("available", isAvailable));
    }

    // Check if branch exists in location
    @GetMapping("/check-branch")
    public ResponseEntity<Map<String, Boolean>> checkBranchExists(
            @RequestParam String country,
            @RequestParam String city,
            @RequestParam String bankName,
            @RequestParam String branch) {
        boolean exists = bankService.branchExistsInLocation(country, city, bankName, branch);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    // Get all banks for reference
    @GetMapping("/all")
    public List<Bank> getAllBanks() {
        return bankService.getAllBanks();
    }
}

