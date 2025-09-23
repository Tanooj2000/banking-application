package com.example.bank_service.entity;

import jakarta.persistence.*;
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

    private String name;
    private String country;
    private String city;
}

