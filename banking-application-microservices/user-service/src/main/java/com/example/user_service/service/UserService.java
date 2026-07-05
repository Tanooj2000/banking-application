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
    private final JwtService jwtService;
    private final SessionService sessionService;
    private final EmailService emailService;

    public ResponseEntity<String> register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("This username is already taken. Please choose a different username.");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("An account with this email already exists. Please use a different email or login.");
        }
        if (userRepository.findByPhonenumber(request.getPhonenumber()).isPresent()) {
            return ResponseEntity.badRequest().body("An account with this phone number already exists. Please use a different phone number.");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhonenumber(request.getPhonenumber());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        User savedUser = userRepository.save(user);

        // Send welcome email
        try {
            emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getUsername());
        } catch (Exception e) {
            // Log but don't fail registration if email fails
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }

        return ResponseEntity.ok("Registration successful. You can now login with your username or email.");
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
            return ResponseEntity.badRequest().body(
                new LoginResponse(false, "Invalid username/email or password.", null, null, null));
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(
                new LoginResponse(false, "Invalid Password.", null, null, null));
        }
        
        // Generate JWT token
        String jwtToken = jwtService.generateToken(user.getUsername(), user.getId());
        long expirationTime = jwtService.getExpirationTime();
        
        // Create user DTO without password
        LoginResponse.UserDto userDto = new LoginResponse.UserDto(
            user.getId(),
            user.getUsername(), 
            user.getEmail(),
            user.getPhonenumber()
        );
        
        return ResponseEntity.ok(new LoginResponse(
            true, 
            "Login successful.", 
            jwtToken, 
            expirationTime,
            userDto
        ));
    }

    public ResponseEntity<UpdateUserResponse> updateUserDetails(Long userId, UpdateUserRequest request) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(new UpdateUserResponse(false, "User not found. Please verify the user ID.", null));
        }

        User user = optionalUser.get();
        
        // Check if username is being changed and if it's already taken by another user
        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            Optional<User> existingUserWithUsername = userRepository.findByUsername(request.getUsername());
            if (existingUserWithUsername.isPresent() && !existingUserWithUsername.get().getId().equals(userId)) {
                return ResponseEntity.badRequest()
                    .body(new UpdateUserResponse(false, "This username is already in use. Please choose a different username.", null));
            }
            user.setUsername(request.getUsername());
        }
        
        // Check if email is being changed and if it's already taken by another user
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            Optional<User> existingUserWithEmail = userRepository.findByEmail(request.getEmail());
            if (existingUserWithEmail.isPresent() && !existingUserWithEmail.get().getId().equals(userId)) {
                return ResponseEntity.badRequest()
                    .body(new UpdateUserResponse(false, "This email is already in use. Please choose a different email.", null));
            }
            user.setEmail(request.getEmail());
        }
        
        // Check if phone number is being changed and if it's already taken by another user
        if (request.getPhonenumber() != 0 && request.getPhonenumber() != user.getPhonenumber()) {
            Optional<User> existingUserWithPhone = userRepository.findByPhonenumber(request.getPhonenumber());
            if (existingUserWithPhone.isPresent() && !existingUserWithPhone.get().getId().equals(userId)) {
                return ResponseEntity.badRequest()
                    .body(new UpdateUserResponse(false, "This phone number is already in use. Please choose a different number.", null));
            }
            user.setPhonenumber(request.getPhonenumber());
        }
        
        User updatedUser = userRepository.save(user);
        UpdateUserResponse.UserDto userDto = new UpdateUserResponse.UserDto(
            updatedUser.getId(),
            updatedUser.getUsername(),
            updatedUser.getEmail(),
            updatedUser.getPhonenumber()
        );
        return ResponseEntity.ok(new UpdateUserResponse(true, "User details updated successfully", userDto));
    }

    public ResponseEntity<UpdateUserResponse> changePassword(Long userId, ChangePasswordRequest request) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(new UpdateUserResponse(false, "User not found. Please verify the user ID.", null));
        }

        User user = optionalUser.get();
        
        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest()
                .body(new UpdateUserResponse(false, "Current password is incorrect. Please try again.", null));
        }
        
        // Validate new password
        if (request.getNewPassword() == null || request.getNewPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(new UpdateUserResponse(false, "New password cannot be empty.", null));
        }
        
        // Check if new password is same as current password
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            return ResponseEntity.badRequest()
                .body(new UpdateUserResponse(false, "New password must be different from your current password.", null));
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        User updatedUser = userRepository.save(user);
        
        UpdateUserResponse.UserDto userDto = new UpdateUserResponse.UserDto(
            updatedUser.getId(),
            updatedUser.getUsername(),
            updatedUser.getEmail(),
            updatedUser.getPhonenumber()
        );
        return ResponseEntity.ok(new UpdateUserResponse(true, "Password changed successfully", userDto));
    }

    public ResponseEntity<UserDetailsResponse> getUserById(Long userId) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(new UserDetailsResponse(false, "User not found. Please verify the user ID.", null));
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

    public ResponseEntity<String> logout(String token) {
        try {
            // Remove "Bearer " prefix if present
            String jwtToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            
            // Add token to blacklist
            sessionService.blacklistToken(jwtToken);
            
            return ResponseEntity.ok("Logout successful");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Logout failed. Invalid or expired token.");
        }
    }
    
    public ResponseEntity<UserDetailsResponse> getCurrentUser(String token) {
        try {
            // Remove "Bearer " prefix if present
            String jwtToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            
            // Extract userId from JWT token
            Long userId = jwtService.extractUserId(jwtToken);
            
            if (userId == null) {
                return ResponseEntity.badRequest().body(
                    new UserDetailsResponse(false, "Invalid token. Please login again.", null));
            }
            
            // Get user by ID
            Optional<User> optionalUser = userRepository.findById(userId);
            if (optionalUser.isEmpty()) {
                return ResponseEntity.badRequest().body(
                    new UserDetailsResponse(false, "User not found. Please contact support if this persists.", null));
            }
            
            User user = optionalUser.get();
            UserDetailsResponse.UserDto userDto = new UserDetailsResponse.UserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhonenumber()
            );
            
            return ResponseEntity.ok(new UserDetailsResponse(true, "User details retrieved", userDto));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                new UserDetailsResponse(false, "Invalid or expired session. Please login again.", null));
        }
    }

}

