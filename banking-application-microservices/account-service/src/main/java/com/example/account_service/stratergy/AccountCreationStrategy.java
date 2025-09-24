package com.example.account_service.stratergy;

public interface AccountCreationStrategy {
    void createAccount(Object request);
    String getCountryCode();
}