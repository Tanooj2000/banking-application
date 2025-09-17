package com.example.banking_application.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "ukbankaccounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UKBankAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String fullName;
    private String nin;
    private String phone;
    private String email;
    private LocalDate dob;
    private String gender;
    private String occupation;
    private String address;
    private String idProofType;
    private Double deposit;
    private Boolean consent;
    private String bank;
    private String country;
    private String status = "pending";
}
