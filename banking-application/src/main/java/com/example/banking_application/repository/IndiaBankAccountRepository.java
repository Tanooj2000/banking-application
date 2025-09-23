package com.example.banking_application.repository;

import com.example.banking_application.entity.IndiaBankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IndiaBankAccountRepository extends JpaRepository<IndiaBankAccount, Long> {
    List<IndiaBankAccount> findByStatus(String status);
}
