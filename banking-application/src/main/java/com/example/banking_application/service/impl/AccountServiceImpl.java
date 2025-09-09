package com.example.banking_application.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.banking_application.dto.AccountDto;
import com.example.banking_application.entity.Account;
import com.example.banking_application.mapper.AccountMapper;
import com.example.banking_application.repository.AccountRepository;
import com.example.banking_application.service.AccountService;

@Service
public class AccountServiceImpl implements AccountService {
    
    @Autowired
    private AccountRepository accountRepository;

    @Override
    public AccountDto createAccount(AccountDto accountDto) {
        Account account = AccountMapper.mapToAccount(accountDto);
        account = accountRepository.save(account);
        accountDto = AccountMapper.mapToAccountDto(account);
        return accountDto;
    }

    @Override
    public AccountDto getAccount(long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found with id: " + accountId));
        return AccountMapper.mapToAccountDto(account);
    }

    @Override
    public AccountDto deposit(long accountId, long amount) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found with id: " + accountId));
        
        account.setAccountBalance(account.getAccountBalance()+amount);
        account = accountRepository.save(account);
        return AccountMapper.mapToAccountDto(account);
    }

    @Override
    public AccountDto withdraw(long accountId, long amount) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found with id: " + accountId));
        if(account.getAccountBalance() < amount) {
            throw new RuntimeException("Insufficient balance in account with id: " + accountId);
        } else {
            account.setAccountBalance(account.getAccountBalance() - amount);
            account = accountRepository.save(account);
            return AccountMapper.mapToAccountDto(account);
        }
    }

    @Override
    public List<AccountDto> findAllAccounts() {
        List<Account> accounts = accountRepository.findAll();
        return accounts.stream().map((account) -> AccountMapper.mapToAccountDto(account))
                .toList();
    }

    @Override
    public void deleteAccount(long accountId) {
        accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found with id: " + accountId));
        accountRepository.deleteById(accountId);
    }
    
    
}
