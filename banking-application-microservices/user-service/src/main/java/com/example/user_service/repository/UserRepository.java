package com.example.user_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.user_service.entity.User;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}

