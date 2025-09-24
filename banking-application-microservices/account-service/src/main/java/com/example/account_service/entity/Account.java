package com.example.account_service.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Account {

   @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public Long userId;
    public String country;
    public String fullName;
    public String email;
    public LocalDate dob;
    public String gender;
    public String occupation;
    public String address;
    public BigDecimal deposit;
    public boolean consent;
    //based on country either of these will be used
    public String aadhaar;
    public String pan;
    public String mobile;
    public String ssn;
    public String phone;
    public String nin;
    @Enumerated(EnumType.STRING)
    private AccountType accountType;
    @Enumerated(EnumType.STRING)
    private AccountStatus status;
}

