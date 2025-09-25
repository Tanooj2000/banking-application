package com.example.account_service.stratergy;

import com.example.account_service.dto.UsaAccountRequest;
import com.example.account_service.entity.Account;
import com.example.account_service.repository.AccountRepository;

import java.time.LocalDate;

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
        account.setUserId(req.getUserId());
        account.setCountry("US");
        account.setFullName(req.getFullName());
        account.setSsn(req.getSsn());
        account.setMobile(req.getMobile());
        account.setEmail(req.getEmail());
        account.setBank(req.getBank());
        account.setDob(LocalDate.parse(req.getDob()));
        account.setGender(req.getGender());
        account.setOccupation(req.getOccupation());
        account.setAddress(req.getAddress());
        account.setDeposit(req.getDeposit());
        account.setConsent(req.isConsent());
        account.setAccountType(req.getAccountType());
        account.setStatus(req.getStatus());

        accountRepository.save(account);
    }

    @Override
    public String getCountryCode() {
        return "US";
    }
}
