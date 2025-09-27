package com.example.bank_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.example.bank_service.entity.Bank;
import com.example.bank_service.service.BankService;

import java.util.List;

@RestController
@RequestMapping("/api/banks")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
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

    @PostMapping("/add")
    public Bank addBank(@RequestBody Bank bank) {
        return bankService.addBank(bank);
    }
}

