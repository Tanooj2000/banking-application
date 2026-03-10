package com.example.user_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {
    private boolean success;
    private String message;
    private String token;
    private Long expiresIn;
    private UserDto user;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserDto {
        private Long id;
        private String username;
        private String email;
        private Long phonenumber;
    }
}
