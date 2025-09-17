package com.example.banking_application.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "indiabankaccounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IndiaBankAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String aadhaar;
    private String pan;
    private String mobile;
    private String email;
    private java.time.LocalDate dob;
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
