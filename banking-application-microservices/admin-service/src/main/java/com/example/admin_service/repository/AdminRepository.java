package com.example.admin_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.admin_service.entity.Admin;

import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByUsername(String username);
}

