package com.example.account_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.example.account_service.dto.AccountRequest;
import com.example.account_service.entity.Account;
import com.example.account_service.entity.AccountStatus;
import com.example.account_service.repository.AccountRepository;

import java.util.List;

@Service
public class AccountService {

    @Autowired
    private AccountStrategyFactory strategyFactory;

    @Autowired
    private AccountRepository accountRepository;

    public void createAccount(String country, Map<String, Object> payload) {
        AccountCreationStrategy strategy = strategyFactory.getStrategy(country);
        if (strategy == null) {
            throw new IllegalArgumentException("Unsupported country: " + country);
        }

        Object dto = convertPayloadToDto(payload, country);
        strategy.createAccount(dto);
    }

    public List<Account> getAccountsByUserId(Long userId) {
        return accountRepository.findByUserId(userId);
    }

    private Object convertPayloadToDto(Map<String, Object> payload, String country) {
        ObjectMapper mapper = new ObjectMapper();
        switch (country.toUpperCase()) {
            case "IN": return mapper.convertValue(payload, IndiaAccountRequest.class);
            case "US": return mapper.convertValue(payload, USAAccountRequest.class);
            case "UK": return mapper.convertValue(payload, UKAccountRequest.class);
            default: throw new IllegalArgumentException("Invalid country");
        }
    }
}