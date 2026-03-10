package com.example.bank_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.ResponseEntity;

import com.example.bank_service.entity.Bank;
import com.example.bank_service.repository.BankRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BankService {

    private final BankRepository bankRepository;

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

    public List<Bank> getAllBanks() {
        return bankRepository.findAll();
    }
}

