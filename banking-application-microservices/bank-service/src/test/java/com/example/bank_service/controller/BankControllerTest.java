package com.example.bank_service.controller;

import com.example.bank_service.entity.Bank;
import com.example.bank_service.service.BankService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doReturn;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.is;

@WebMvcTest(BankController.class)
@DisplayName("BankController Tests")
class BankControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private BankService bankService;

    private Bank sampleBank() {
        Bank b = new Bank();
        b.setId(1L);
        b.setCountry("India");
        b.setCity("Mumbai");
        b.setBankName("BankA");
        b.setBranch("Branch1");
        b.setCode("ABC123");
        return b;
    }

    @Test
    void getBanksByCountry() throws Exception {
        when(bankService.getBanksByCountry("India")).thenReturn(List.of(sampleBank()));

        mockMvc.perform(get("/api/banks/country/India"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].bankName", is("BankA")));
    }

    @Test
    void addBank() throws Exception {
        Bank b = sampleBank();
        doReturn((org.springframework.http.ResponseEntity<?>)org.springframework.http.ResponseEntity.ok(b))
            .when(bankService).addBankWithValidation(any());

        String json = "{\"country\":\"India\",\"city\":\"Mumbai\",\"bankName\":\"BankA\",\"branch\":\"Branch1\",\"code\":\"ABC123\"}";

        mockMvc.perform(post("/api/banks/add").contentType(MediaType.APPLICATION_JSON).content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.bankName", is("BankA")));
    }

    @Test
    void checkBankCodeAvailability() throws Exception {
        when(bankService.isBankCodeAvailable("ABC123")).thenReturn(false);

        mockMvc.perform(get("/api/banks/check-code/ABC123"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.available", is(false)));
    }
}
