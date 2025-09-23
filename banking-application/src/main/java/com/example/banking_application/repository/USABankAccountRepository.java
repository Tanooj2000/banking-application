package com.example.banking_application.repository;

import com.example.banking_application.entity.USABankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface USABankAccountRepository extends JpaRepository<USABankAccount, Long> {
    List<USABankAccount> findByStatus(String status);
}
