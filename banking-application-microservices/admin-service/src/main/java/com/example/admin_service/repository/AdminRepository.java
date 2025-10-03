package com.example.admin_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.admin_service.entity.Admin;
import com.example.admin_service.entity.ApplicationStatus;

import java.util.List;
import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByUsername(String username);

    Optional<Admin> findByEmail(String email);

    List<Admin> findByBankname(String bankname);
    
    List<Admin> findByVerifiedByRootFalse();
    
    List<Admin> findByApplicationStatus(ApplicationStatus status);
}

