package com.example.bank_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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

    public Bank addBank(Bank bank) {
        return bankRepository.save(bank);
    }
}

