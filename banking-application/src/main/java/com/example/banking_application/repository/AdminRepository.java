package com.example.banking_application.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.banking_application.entity.Admin;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {
    // Add custom query methods if needed
}