package com.example.user_service.service;

import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.user_service.dto.LoginRequest;
import com.example.user_service.dto.RegisterRequest;
import com.example.user_service.entity.User;
import com.example.user_service.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ResponseEntity<String> register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }
        if (userRepository.findByPhonenumber(request.getPhonenumber()).isPresent()) {
            return ResponseEntity.badRequest().body("Phone number already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhonenumber(request.getPhonenumber());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully.");
    }

    public Map<String, Object> login(LoginRequest request) {
        Map<String, Object> result = new java.util.HashMap<>();
        User user = userRepository.findByUsername(request.getUsername()).orElse(null);
        if (user == null) {
            result.put("user", null);
            result.put("message", "User not found");
            return result;
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            result.put("user", null);
            result.put("message", "Invalid credentials");
            return result;
        }
        result.put("user", user);
        result.put("message", "Login successful");
        return result;
    }

}

