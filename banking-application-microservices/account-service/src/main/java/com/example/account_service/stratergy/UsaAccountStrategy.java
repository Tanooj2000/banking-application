package com.example.account_service.stratergy;

import com.example.account_service.dto.UsaAccountRequest;
import com.example.account_service.entity.Account;
import com.example.account_service.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class UsaAccountStrategy implements AccountCreationStrategy {

    @Autowired
    private AccountRepository accountRepository;

    @Override
    public void createAccount(Object request) {
    UsaAccountRequest req = (UsaAccountRequest) request;

    Account account = new Account();
    account.userId = req.userId;
    account.country = "US";
    account.fullName = req.fullName;
    account.ssn = req.ssn;
    account.mobile = req.mobile;
    account.email = req.email;
    account.dob = req.dob;
    account.gender = req.gender;
    account.occupation = req.occupation;
    account.address = req.address;
    account.deposit = req.deposit;
    account.consent = req.consent;
    account.accountType = req.accountType;
    account.status = req.status;

    accountRepository.save(account);
    }

    @Override
    public String getCountryCode() {
        return "US";
    }
}
