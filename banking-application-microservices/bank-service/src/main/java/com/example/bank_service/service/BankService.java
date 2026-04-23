package com.example.bank_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.Errors;
import jakarta.validation.Validator;
import jakarta.validation.ConstraintViolation;

import com.example.bank_service.entity.Bank;
import com.example.bank_service.repository.BankRepository;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BankService {

    private final BankRepository bankRepository;
    private final Validator validator;

    public List<Bank> getBanksByCountry(String country) {
        return bankRepository.findByCountry(country);
    }

    public List<Bank> getBanksByCountryAndCity(String country, String city) {
        return bankRepository.findByCountryAndCity(country, city);
    }

    public ResponseEntity<?> addBankWithValidation(Bank bank) {
        // Check if branch already exists in that area (country/city/bankName/branch)
        List<Bank> banksInArea = getBanksByCountryAndCity(bank.getCountry(), bank.getCity());
        boolean branchExists = banksInArea.stream()
                .anyMatch(b -> b.getBankName().equalsIgnoreCase(bank.getBankName()) &&
                              b.getBranch().equalsIgnoreCase(bank.getBranch()));

        if (branchExists) {
            return ResponseEntity.badRequest().body("Branch already exists in that area.");
        }

        // Check if branch code exists
        List<Bank> allBanks = getAllBanks();
        boolean branchCodeExists = allBanks.stream()
                .anyMatch(b -> b.getCode().equalsIgnoreCase(bank.getCode()));

        if (branchCodeExists) {
            return ResponseEntity.badRequest().body("A branch with that code already exists. Use correct branch code.");
        }

        Bank savedBank = bankRepository.save(bank);
        return ResponseEntity.ok(savedBank);
    }

    public ResponseEntity<?> addBankWithEnhancedValidation(Bank bank) {
        // Bean validation
        Set<ConstraintViolation<Bank>> violations = validator.validate(bank);
        if (!violations.isEmpty()) {
            List<String> errors = new ArrayList<>();
            for (ConstraintViolation<Bank> violation : violations) {
                errors.add(violation.getMessage());
            }
            return ResponseEntity.badRequest().body(Map.of("errors", errors));
        }

        // Business logic validation
        ResponseEntity<?> validationResult = validateBankData(bank);
        if (!validationResult.getStatusCode().is2xxSuccessful()) {
            return validationResult;
        }

        try {
            Bank savedBank = bankRepository.save(bank);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                    "message", "Bank added successfully",
                    "bank", savedBank
                ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to save bank: " + e.getMessage()));
        }
    }

    public ResponseEntity<?> addBanksBulk(List<Bank> banks) {
        List<Bank> successfulBanks = new ArrayList<>();
        List<Map<String, Object>> errors = new ArrayList<>();

        for (int i = 0; i < banks.size(); i++) {
            Bank bank = banks.get(i);
            
            // Validate each bank
            Set<ConstraintViolation<Bank>> violations = validator.validate(bank);
            if (!violations.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("index", i);
                error.put("bank", bank);
                List<String> errorMessages = new ArrayList<>();
                for (ConstraintViolation<Bank> violation : violations) {
                    errorMessages.add(violation.getMessage());
                }
                error.put("errors", errorMessages);
                errors.add(error);
                continue;
            }

            // Check business rules
            if (branchExistsInLocation(bank.getCountry(), bank.getCity(), bank.getBankName(), bank.getBranch())) {
                Map<String, Object> error = new HashMap<>();
                error.put("index", i);
                error.put("bank", bank);
                error.put("errors", List.of("Branch already exists in that area"));
                errors.add(error);
                continue;
            }

            if (!isBankCodeAvailable(bank.getCode())) {
                Map<String, Object> error = new HashMap<>();
                error.put("index", i);
                error.put("bank", bank);
                error.put("errors", List.of("Bank code already exists"));
                errors.add(error);
                continue;
            }

            successfulBanks.add(bank);
        }

        // Save successful banks
        List<Bank> savedBanks = new ArrayList<>();
        if (!successfulBanks.isEmpty()) {
            savedBanks = bankRepository.saveAll(successfulBanks);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalProcessed", banks.size());
        response.put("successful", savedBanks.size());
        response.put("failed", errors.size());
        response.put("savedBanks", savedBanks);
        response.put("errors", errors);

        if (errors.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } else {
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).body(response);
        }
    }

    public ResponseEntity<?> validateBankData(Bank bank) {
        List<String> errors = new ArrayList<>();

        // Check if branch already exists in that area
        if (branchExistsInLocation(bank.getCountry(), bank.getCity(), bank.getBankName(), bank.getBranch())) {
            errors.add("Branch already exists in that area");
        }

        // Check if branch code exists
        if (!isBankCodeAvailable(bank.getCode())) {
            errors.add("Bank code already exists");
        }

        if (!errors.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "errors", errors));
        }

        return ResponseEntity.ok(Map.of("valid", true, "message", "Bank data is valid"));
    }

    public boolean isBankCodeAvailable(String code) {
        return getAllBanks().stream()
            .noneMatch(b -> b.getCode().equalsIgnoreCase(code));
    }

    public boolean branchExistsInLocation(String country, String city, String bankName, String branch) {
        List<Bank> banksInArea = getBanksByCountryAndCity(country, city);
        return banksInArea.stream()
            .anyMatch(b -> b.getBankName().equalsIgnoreCase(bankName) &&
                          b.getBranch().equalsIgnoreCase(branch));
    }

    public List<Bank> getAllBanks() {
        return bankRepository.findAll();
    }
}

