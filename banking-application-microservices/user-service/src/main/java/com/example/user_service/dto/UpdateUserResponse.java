package com.example.user_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.example.user_service.entity.User;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserResponse {
    private boolean success;
    private String message;
    private User user;
}