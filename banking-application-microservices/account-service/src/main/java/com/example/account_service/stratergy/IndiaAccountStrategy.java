package com.example.account_service.stratergy;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.example.account_service.dto.IndiaAccountRequest;
import com.example.account_service.entity.Account;
import com.example.account_service.repository.AccountRepository;

@Component
public class IndiaAccountStrategy implements AccountCreationStrategy {

    @Autowired
    private AccountRepository accountRepository;

    @Override
    public void createAccount(Object request) {
        IndiaAccountRequest req = (IndiaAccountRequest) request;
        System.out.println("Creating account for India: " + req);
        Account account = new Account();
        account.setUserId(req.getUserId());
        account.setCountry("IN");
        account.setFullName(req.getFullName());
        account.setAadhaar(req.getAadhaar());
        account.setPan(req.getPan());
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
        return "IN";
    }
}