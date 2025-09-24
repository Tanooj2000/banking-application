package com.example.account_service.stratergy;

import com.example.account_service.dto.UkAccountRequest;
import com.example.account_service.entity.Account;
import com.example.account_service.repository.AccountRepository;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class UkAccountStrategy implements AccountCreationStrategy {

    @Autowired
    private AccountRepository accountRepository;

    @Override
    public void createAccount(Object request) {
        UkAccountRequest req = (UkAccountRequest) request;

        Account account = new Account();
        account.setUserId(req.getUserId());
        account.setCountry("UK");
        account.setFullName(req.getFullName());
    account.setNin(req.getNin());
        account.setMobile(req.getMobile());
        account.setEmail(req.getEmail());
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
        return "UK";
    }
}
