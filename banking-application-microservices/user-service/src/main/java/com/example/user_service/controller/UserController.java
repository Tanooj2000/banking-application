package com.example.user_service.controller;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.user_service.dto.LoginRequest;
import com.example.user_service.dto.LoginResponse;
import com.example.user_service.dto.RegisterRequest;
import com.example.user_service.dto.UpdateUserRequest;
import com.example.user_service.dto.UpdateUserResponse;
import com.example.user_service.dto.ChangePasswordRequest;
import com.example.user_service.dto.UserDetailsResponse;
import com.example.user_service.dto.AllUsersResponse;
import com.example.user_service.service.UserService;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        return userService.register(request);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return userService.login(request);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserDetailsResponse> getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }
    
    @GetMapping
    public ResponseEntity<AllUsersResponse> getAllUsers() {
        return userService.getAllUsers();
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<UpdateUserResponse> updateUserDetails(
            @PathVariable Long id, 
            @RequestBody UpdateUserRequest request) {
        return userService.updateUserDetails(id, request);
    }
    
    @PutMapping("/{id}/password")
    public ResponseEntity<UpdateUserResponse> changePassword(
            @PathVariable Long id, 
            @RequestBody ChangePasswordRequest request) {
        return userService.changePassword(id, request);
    }
    
}