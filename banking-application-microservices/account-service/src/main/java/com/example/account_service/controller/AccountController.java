package com.example.account_service.controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.account_service.entity.Account;
import com.example.account_service.service.AccountService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:3000"},
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
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

        @GetMapping("/bank/{bankName}")
        public ResponseEntity<List<Account>> getAccountsByBankName(@PathVariable String bankName) {
            List<Account> accounts = accountService.getAccountsByBankName(bankName);
            if (accounts.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(accounts);
        }
}