package com.example.account_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import com.example.account_service.dto.IndiaAccountRequest;
import com.example.account_service.dto.UkAccountRequest;
import com.example.account_service.dto.UsaAccountRequest;
import com.example.account_service.entity.Account;

import com.example.account_service.factory.AccountStrategyFactory;
import com.example.account_service.repository.AccountRepository;
import com.example.account_service.stratergy.AccountCreationStrategy;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Service
public class AccountService {
    
    @Autowired
    private AccountRepository accountRepository;
    
    @Autowired
    private AccountStrategyFactory strategyFactory;
    
    @Autowired
    private EmailNotificationService emailNotificationService;
    public void approveAccount(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        if (account.getStatus() != null && account.getStatus().name().equals("PENDING")) {
            account.setStatus(com.example.account_service.entity.AccountStatus.APPROVED);
            String accountNumber = generateRandomAccountNumber();
            account.setAccountNumber(accountNumber);
            accountRepository.save(account);
            
            // Send email notification to account holder
            emailNotificationService.notifyAccountApproved(account);
            System.out.println("Approval notification sent to: " + account.getEmail());
        } else {
            throw new IllegalArgumentException("Account can only be approved from PENDING status");
        }
    }
    private String generateRandomAccountNumber() {
    long randomNum = (long) (Math.random() * 1_000_000_000_000L); // Generate a random number up to 12 digits
    return String.format("%012d", randomNum); // Ensure it's 12 digits with leading zeros if necessary
}

    public void rejectAccount(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        if (account.getStatus() != null && account.getStatus().name().equals("PENDING")) {
            account.setStatus(com.example.account_service.entity.AccountStatus.REJECTED);
            accountRepository.save(account);
            
            // Send email notification to account holder
            emailNotificationService.notifyAccountRejected(account);
            System.out.println("Rejection notification sent to: " + account.getEmail());
        } else {
            throw new IllegalArgumentException("Account can only be rejected from PENDING status");
        }
    }

   

   public Account createAccount(String country, Map<String, Object> payload) {
    AccountCreationStrategy strategy = strategyFactory.getStrategy(country);
    if (strategy == null) {
        throw new IllegalArgumentException("Unsupported country: " + country);
    }
    System.out.println("Creating account for country: " + country);
    // Extract userId and bank from the payload for validation
    Long userId = ((Number) payload.get("userId")).longValue(); // Properly convert userId to Long
    String bank = (String) payload.get("bank");
    String branch = (String) payload.get("branch");
    System.out.println("Bank: " + bank);
    System.out.println("Branch: " + branch);


    // Check if an account already exists for the user in the same bank and branch
 boolean accountExistsInBankAndBranch = accountRepository.existsByUserIdAndBankAndBranch(userId, bank, branch);
 
if (accountExistsInBankAndBranch) {
    throw new IllegalArgumentException("User already has an account in the bank: " + bank + " and branch: " + branch);
}

    Object dto = convertPayloadToDto(payload, country);
    Account createdAccount = strategy.createAccount(dto);
    
    // Send notification to admin about new account creation
    if (createdAccount != null) {
        emailNotificationService.notifyAdminAccountCreated(createdAccount);
        System.out.println("Admin notification sent for account ID: " + createdAccount.getId());
    }
    
    return createdAccount;
}

    public List<Account> getAccountsByUserId(Long userId) {
        return accountRepository.findByUserId(userId);
    }

        public List<Account> getAccountsByBankName(String bankName) {
            return accountRepository.findByBank(bankName);
        }

    private Object convertPayloadToDto(Map<String, Object> payload, String country) {
        ObjectMapper mapper = new ObjectMapper();
        switch (country.toUpperCase()) {
            case "IN": return mapper.convertValue(payload, IndiaAccountRequest.class);
            case "US": return mapper.convertValue(payload, UsaAccountRequest.class);
            case "UK": return mapper.convertValue(payload, UkAccountRequest.class);
            default: throw new IllegalArgumentException("Invalid country");
        }
    }
}