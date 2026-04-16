package com.example.account_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.account_service.entity.Account;
import com.example.account_service.entity.AccountStatus;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    
    // User-based queries
    List<Account> findByUserId(String userId);
    
    // Bank-based queries
    List<Account> findByBank(String bank);
    List<Account> findByBankAndBranch(String bank, String branch);
    
    // Account number queries  
    Optional<Account> findByAccountNumber(String accountNumber);
    
    // Status-based queries
    List<Account> findByStatus(AccountStatus status);
    List<Account> findByStatusAndCountry(AccountStatus status, String country);
    
    // Country-based queries
    List<Account> findByCountry(String country);
    
    // Existence checks
    boolean existsByUserIdAndBankAndBranch(String userId, String bank, String branch);
    boolean existsByAccountNumber(String accountNumber);
    
    // Complex search queries
    @Query("SELECT a FROM Account a WHERE a.userId = :userId AND a.status = :status")
    List<Account> findByUserIdAndStatus(String userId, AccountStatus status);
    
    @Query("SELECT a FROM Account a WHERE a.bank = :bank AND a.status = :status")
    List<Account> findByBankAndStatus(String bank, AccountStatus status);
    
    // Count queries for dashboard
    @Query("SELECT COUNT(a) FROM Account a WHERE a.status = :status")
    long countByStatus(AccountStatus status);
    
    @Query("SELECT COUNT(a) FROM Account a WHERE a.country = :country AND a.status = :status")
    long countByCountryAndStatus(String country, AccountStatus status);
}

