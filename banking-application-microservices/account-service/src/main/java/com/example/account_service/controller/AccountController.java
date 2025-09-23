package com.example.account_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.example.account_service.dto.AccountRequest;
import com.example.account_service.entity.Account;
import com.example.account_service.service.AccountService;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping("/create")
    public String createAccount(@RequestBody AccountRequest request) {
        return accountService.createAccount(request);
    }

    @GetMapping("/pending")
    public List<Account> getPendingAccounts() {
        return accountService.getPendingAccounts();
    }

    @PostMapping("/approve/{id}")
    public String approve(@PathVariable Long id) {
        return accountService.approveAccount(id);
    }

    @PostMapping("/reject/{id}")
    public String reject(@PathVariable Long id) {
        return accountService.rejectAccount(id);
    }
}

