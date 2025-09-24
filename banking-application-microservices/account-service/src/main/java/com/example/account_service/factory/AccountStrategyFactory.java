package com.example.account_service.factory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.example.account_service.stratergy.AccountCreationStrategy;

@Component
public class AccountStrategyFactory {

    private final Map<String, AccountCreationStrategy> strategyMap = new HashMap<>();

    @Autowired
    public AccountStrategyFactory(List<AccountCreationStrategy> strategies) {
        for (AccountCreationStrategy strategy : strategies) {
            strategyMap.put(strategy.getCountryCode().toUpperCase(), strategy);
        }
    }

    public AccountCreationStrategy getStrategy(String countryCode) {
        return strategyMap.get(countryCode.toUpperCase());
    }
}