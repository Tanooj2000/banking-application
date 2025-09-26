package com.example.user_service.service;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.user_service.dto.LoginResponse;
import com.example.user_service.dto.LoginRequest;
import com.example.user_service.dto.RegisterRequest;
import com.example.user_service.dto.UpdateUserRequest;
import com.example.user_service.dto.UpdateUserResponse;
import com.example.user_service.dto.ChangePasswordRequest;
import com.example.user_service.dto.UserDetailsResponse;
import com.example.user_service.dto.AllUsersResponse;
import com.example.user_service.entity.User;
import com.example.user_service.repository.UserRepository;
import java.util.Optional;
import java.util.List;
import java.util.stream.Collectors;

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

    public ResponseEntity<UpdateUserResponse> updateUserDetails(Long userId, UpdateUserRequest request) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(new UpdateUserResponse(false, "User not found", null));
        }

        User user = optionalUser.get();
        
        // Check if username is being changed and if it's already taken by another user
        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            Optional<User> existingUserWithUsername = userRepository.findByUsername(request.getUsername());
            if (existingUserWithUsername.isPresent() && !existingUserWithUsername.get().getId().equals(userId)) {
                return ResponseEntity.badRequest()
                    .body(new UpdateUserResponse(false, "Username already exists", null));
            }
            user.setUsername(request.getUsername());
        }
        
        // Check if email is being changed and if it's already taken by another user
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            Optional<User> existingUserWithEmail = userRepository.findByEmail(request.getEmail());
            if (existingUserWithEmail.isPresent() && !existingUserWithEmail.get().getId().equals(userId)) {
                return ResponseEntity.badRequest()
                    .body(new UpdateUserResponse(false, "Email already exists", null));
            }
            user.setEmail(request.getEmail());
        }
        
        // Check if phone number is being changed and if it's already taken by another user
        if (request.getPhonenumber() != 0 && request.getPhonenumber() != user.getPhonenumber()) {
            Optional<User> existingUserWithPhone = userRepository.findByPhonenumber(request.getPhonenumber());
            if (existingUserWithPhone.isPresent() && !existingUserWithPhone.get().getId().equals(userId)) {
                return ResponseEntity.badRequest()
                    .body(new UpdateUserResponse(false, "Phone number already exists", null));
            }
            user.setPhonenumber(request.getPhonenumber());
        }
        
        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(new UpdateUserResponse(true, "User details updated successfully", updatedUser));
    }

    public ResponseEntity<UpdateUserResponse> changePassword(Long userId, ChangePasswordRequest request) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(new UpdateUserResponse(false, "User not found", null));
        }

        User user = optionalUser.get();
        
        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest()
                .body(new UpdateUserResponse(false, "Current password is incorrect", null));
        }
        
        // Validate new password
        if (request.getNewPassword() == null || request.getNewPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(new UpdateUserResponse(false, "New password cannot be empty", null));
        }
        
        // Check if new password is same as current password
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            return ResponseEntity.badRequest()
                .body(new UpdateUserResponse(false, "New password must be different from current password", null));
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        User updatedUser = userRepository.save(user);
        
        // Don't return the user object with password for security
        updatedUser.setPassword(null);
        return ResponseEntity.ok(new UpdateUserResponse(true, "Password changed successfully", updatedUser));
    }

    public ResponseEntity<UserDetailsResponse> getUserById(Long userId) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(new UserDetailsResponse(false, "User not found", null));
        }

        User user = optionalUser.get();
        UserDetailsResponse.UserDto userDto = new UserDetailsResponse.UserDto(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getPhonenumber()
        );
        
        return ResponseEntity.ok(new UserDetailsResponse(true, "User details retrieved successfully", userDto));
    }

    public ResponseEntity<AllUsersResponse> getAllUsers() {
        List<User> users = userRepository.findAll();
        
        List<UserDetailsResponse.UserDto> userDtos = users.stream()
            .map(user -> new UserDetailsResponse.UserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhonenumber()
            ))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(new AllUsersResponse(true, "All users retrieved successfully", userDtos));
    }

}

