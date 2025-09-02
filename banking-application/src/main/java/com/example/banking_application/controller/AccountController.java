package com.example.banking_application.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.banking_application.dto.AccountDto;
import com.example.banking_application.service.AccountService;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    @Autowired
    private AccountService accountService;

    @PostMapping
    public ResponseEntity<AccountDto> addAccount(@RequestBody AccountDto accountDto){
        return new ResponseEntity<>(accountService.createAccount(accountDto),HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<AccountDto> getAccountById(@RequestParam long id){
        return ResponseEntity.ok(accountService.getAccount(id));
    }

    @PutMapping("/deposit/{id}/{amount}")
    public ResponseEntity<AccountDto> moneyDeposit(@PathVariable long id,@PathVariable Long amount){
        return ResponseEntity.ok(accountService.deposit(id, amount));
    }

    @PutMapping("/withdraw/{id}/{amount}")
    public ResponseEntity<AccountDto> moneyWithdraw(@PathVariable long id,@PathVariable long amount){
        return ResponseEntity.ok(accountService.withdraw(id, amount));
    }

    @GetMapping("/allaccounts")
    public ResponseEntity<List<AccountDto>> getAllAccounts() {
        return ResponseEntity.ok(accountService.findAllAccounts());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<String> removeAccount(@PathVariable long id){
        accountService.deleteAccount(id);
        return ResponseEntity.ok("Account deleted successfully");
    }
}
