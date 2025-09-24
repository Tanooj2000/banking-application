package com.example.account_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.example.account_service.dto.AccountRequest;
import com.example.account_service.entity.Account;
import com.example.account_service.service.AccountService;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    @Autowired
    private AccountService accountService;

    @PostMapping("/create/{country}")
    public ResponseEntity<String> createAccount(@PathVariable String country, @RequestBody Map<String, Object> payload) {
        try {
            accountService.createAccount(country, payload);
            return ResponseEntity.ok("Account created for " + country);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Account>> getAccountsByUserId(@PathVariable Long userId) {
        List<Account> accounts = accountService.getAccountsByUserId(userId);
        if (accounts.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(accounts);
    }
}