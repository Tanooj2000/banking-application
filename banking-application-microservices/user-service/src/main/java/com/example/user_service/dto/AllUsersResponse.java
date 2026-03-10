package com.example.user_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AllUsersResponse {
    private boolean success;
    private String message;
    private List<UserDetailsResponse.UserDto> users;
}