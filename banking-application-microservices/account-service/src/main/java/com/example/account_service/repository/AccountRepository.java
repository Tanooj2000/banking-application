package com.example.account_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.account_service.entity.Account;
import com.example.account_service.entity.AccountStatus;

import java.util.List;

public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByStatus(AccountStatus status);
}

