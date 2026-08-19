package com.example.bank_service.service;

import com.example.bank_service.entity.Bank;
import com.example.bank_service.repository.BankRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("BankService Unit Tests")
class BankServiceTest {

    @Mock private BankRepository bankRepository;
    private Validator validator;

    @InjectMocks
    private BankService bankService;

    @BeforeEach
    void setUp() {
        this.validator = Validation.buildDefaultValidatorFactory().getValidator();
        org.springframework.test.util.ReflectionTestUtils.setField(bankService, "validator", this.validator);
    }

    private Bank sampleBank() {
        Bank b = new Bank();
        b.setCountry("India");
        b.setCity("Mumbai");
        b.setBankName("BankA");
        b.setBranch("Branch1");
        b.setCode("ABC123");
        return b;
    }

    @Test
    void getBanksByCountryReturnsList() {
        Bank b = sampleBank();
        when(bankRepository.findByCountry("India")).thenReturn(List.of(b));

        List<Bank> result = bankService.getBanksByCountry("India");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getBankName()).isEqualTo("BankA");
    }

    @Test
    void addBankWithValidationRejectsDuplicateBranch() {
        Bank b = sampleBank();
        when(bankRepository.findByCountryAndCity("India", "Mumbai")).thenReturn(List.of(b));

        ResponseEntity<?> resp = bankService.addBankWithValidation(b);

        assertThat(resp.getStatusCode().is4xxClientError()).isTrue();
        assertThat(resp.getBody().toString()).contains("Branch already exists");
    }

    @Test
    void addBankWithValidationRejectsDuplicateCode() {
        Bank b = sampleBank();
        when(bankRepository.findByCountryAndCity("India", "Mumbai")).thenReturn(List.of());
        when(bankRepository.findAll()).thenReturn(List.of(b));

        ResponseEntity<?> resp = bankService.addBankWithValidation(b);

        assertThat(resp.getStatusCode().is4xxClientError()).isTrue();
        assertThat(resp.getBody().toString().toLowerCase()).contains("code");
    }

    @Test
    void addBankWithValidationSuccess() {
        Bank b = sampleBank();
        when(bankRepository.findByCountryAndCity("India", "Mumbai")).thenReturn(List.of());
        when(bankRepository.findAll()).thenReturn(List.of());
        when(bankRepository.save(any(Bank.class))).thenAnswer(i -> {
            Bank arg = i.getArgument(0);
            arg.setId(1L);
            return arg;
        });

        ResponseEntity<?> resp = bankService.addBankWithValidation(b);

        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getBody()).isInstanceOf(Bank.class);
        Bank saved = (Bank) resp.getBody();
        assertThat(saved.getId()).isNotNull();
    }

    @Test
    void isBankCodeAvailableChecksCorrectly() {
        Bank b = sampleBank();
        when(bankRepository.findAll()).thenReturn(List.of(b));

        assertThat(bankService.isBankCodeAvailable("ABC123")).isFalse();
        assertThat(bankService.isBankCodeAvailable("XYZ999")).isTrue();
    }
}
