package com.example.banking_application.mapper;

import com.example.banking_application.dto.AccountDto;
import com.example.banking_application.entity.Account;

public class AccountMapper {

    public static Account mapToAccount(AccountDto accountDto){
        Account account = new Account(
            accountDto.getId(),
            accountDto.getAccountHolderName(),
            accountDto.getAccountBalance()
        );
        return account;
    }

    public static AccountDto mapToAccountDto(Account account){
        AccountDto accountDto = new AccountDto();
        accountDto.setId(account.getId());
        accountDto.setAccountHolderName(account.getAccountHolderName());
        accountDto.setAccountBalance(account.getAccountBalance());
        return accountDto;
    }
}
