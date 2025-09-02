package com.example.banking_application.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AccountDto {
    
    private Long id;
    
    private String accountHolderName;

    private Long accountBalance;

}
