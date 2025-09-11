package com.example.banking_application.service;

import java.util.List;
import com.example.banking_application.dto.AccountDto;

public interface AccountService {

    public AccountDto createAccount(AccountDto accountDto);

    public AccountDto getAccount(long accoundId);

    public AccountDto deposit(long accountId, long amount);

    public AccountDto withdraw(long accountId,long amount);

    public List<AccountDto> findAllAccounts();

    public void deleteAccount(long accountId);
}
