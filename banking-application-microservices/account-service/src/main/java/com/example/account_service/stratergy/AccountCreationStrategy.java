package com.example.account_service.stratergy;

import com.example.account_service.entity.Account;

public interface AccountCreationStrategy {
    Account createAccount(Object request);
    String getCountryCode();
    boolean validateCountrySpecificFields(Object request);
}