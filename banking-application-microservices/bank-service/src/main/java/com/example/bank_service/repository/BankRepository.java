package com.example.bank_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.bank_service.entity.Bank;

import java.util.List;

public interface BankRepository extends JpaRepository<Bank, Long> {
    List<Bank> findByCountry(String country);
    List<Bank> findByCountryAndCity(String country, String city);
}

