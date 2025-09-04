package com.example.banking_application.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    
    private Long id;
    
    private String name;
    private String email;
    private String phone;
}
