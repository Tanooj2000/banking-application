package com.example.bank_service.repository;

import com.example.bank_service.entity.Bank;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@DisplayName("BankRepository Tests")
class BankRepositoryTest {

    @Autowired
    private BankRepository bankRepository;

    private Bank build(String country, String city, String bankName, String branch, String code) {
        Bank b = new Bank();
        b.setCountry(country);
        b.setCity(city);
        b.setBankName(bankName);
        b.setBranch(branch);
        b.setCode(code);
        return b;
    }

    @Test
    void saveAndQuery() {
        Bank saved = bankRepository.save(build("India","Mumbai","BankA","Branch1","ABC123"));
        assertThat(saved.getId()).isNotNull();

        List<Bank> byCountry = bankRepository.findByCountry("India");
        assertThat(byCountry).isNotEmpty();

        List<Bank> byCity = bankRepository.findByCountryAndCity("India","Mumbai");
        assertThat(byCity).isNotEmpty();
    }
}
