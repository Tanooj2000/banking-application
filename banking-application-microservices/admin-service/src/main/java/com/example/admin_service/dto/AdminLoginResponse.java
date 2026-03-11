package com.example.admin_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminLoginResponse {
    private boolean success;
    private String message;
    private String token;
    private Long expiresIn;
    private AdminDto admin;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AdminDto {
        private Long id;
        private String username;
        private String email;
        private String bankname;
        private String country;
        private boolean verifiedByRoot;
        private String applicationStatus;
    }
}
