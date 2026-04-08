package com.example.admin_service.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "admins")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Admin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;
    private String bankname;
    private String country;
    
    @JsonIgnore
    private String password;
    
    private boolean verifiedByRoot;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus applicationStatus = ApplicationStatus.PENDING;
    
    @Column(nullable = false)
    private LocalDateTime createdDate;
    
    private String rejectionReason; // Reason provided when application is rejected
}

