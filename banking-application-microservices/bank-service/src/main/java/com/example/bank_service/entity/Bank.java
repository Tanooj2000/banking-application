package com.example.bank_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "banks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bank {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Country is required")
    @Size(min = 2, max = 50, message = "Country must be between 2 and 50 characters")
    private String country;

    @NotBlank(message = "City is required")
    @Size(min = 2, max = 50, message = "City must be between 2 and 50 characters")
    private String city;

    @NotBlank(message = "Bank name is required")
    @Size(min = 2, max = 100, message = "Bank name must be between 2 and 100 characters")
    private String bankName;

    @NotBlank(message = "Branch is required")
    @Size(min = 2, max = 100, message = "Branch must be between 2 and 100 characters")
    private String branch;

    @NotBlank(message = "Code is required")
    @Pattern(regexp = "^[A-Z0-9]{3,10}$", message = "Code must be 3-10 characters, alphanumeric uppercase only")
    private String code;
}

