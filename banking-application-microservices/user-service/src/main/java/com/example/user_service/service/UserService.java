package com.example.user_service.service;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.user_service.dto.LoginResponse;
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

    public ResponseEntity<LoginResponse> login(LoginRequest request) {
        User user = null;
        // Try to find user by username
        if (request.getUsernameOrEmail() != null && !request.getUsernameOrEmail().isEmpty()) {
            user = userRepository.findByUsername(request.getUsernameOrEmail()).orElse(null);
            if (user == null) {
                // Try to find user by email
                user = userRepository.findByEmail(request.getUsernameOrEmail()).orElse(null);
            }
        }
        if (user == null) {
            return ResponseEntity.badRequest().body(new LoginResponse(false, "User not found", null));
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(new LoginResponse(false, "Invalid credentials", null));
        }
        return ResponseEntity.ok(new LoginResponse(true, "Login successful.", user));
    }

}

