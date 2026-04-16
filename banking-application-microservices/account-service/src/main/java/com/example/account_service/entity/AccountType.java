package com.example.account_service.entity;

import java.util.Set;
import java.util.EnumSet;

public enum AccountType {
    // India
    SAVINGS("Savings", "INDIA"),
    CURRENT("Current", "INDIA"), 
    SALARY("Salary", "INDIA"),
    FIXED_DEPOSIT("Fixed Deposit", "INDIA"),
    
    // USA
    CHECKING("Checking", "USA"),
    MONEY_MARKET("Money Market", "USA"),
    CERTIFICATE_OF_DEPOSIT("Certificate of Deposit", "USA"),
    
    // UK
    ISA("ISA", "UK"),
    FIXED_TERM("Fixed Term", "UK");
    
    private final String displayName;
    private final String country;
    
    AccountType(String displayName, String country) {
        this.displayName = displayName;
        this.country = country;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getCountry() {
        return country;
    }
    
    public static Set<AccountType> getValidTypesForCountry(String country) {
        return switch (country.toUpperCase()) {
            case "INDIA" -> EnumSet.of(SAVINGS, CURRENT, SALARY, FIXED_DEPOSIT);
            case "USA" -> EnumSet.of(CHECKING, SAVINGS, MONEY_MARKET, CERTIFICATE_OF_DEPOSIT);
            case "UK" -> EnumSet.of(CURRENT, SAVINGS, ISA, FIXED_TERM);
            default -> EnumSet.noneOf(AccountType.class);
        };
    }
}

