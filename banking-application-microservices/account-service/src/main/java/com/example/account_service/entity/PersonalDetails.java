package com.example.account_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PersonalDetails {
    
    @NotBlank
    @Size(min = 2, max = 100)
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;
    
    @NotNull
    @Past
    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false)
    private Gender gender;
    
    @NotBlank
    @Email
    @Column(name = "email", nullable = false, length = 100)
    private String email;
    
    @NotBlank
    @Size(min = 10, max = 500)
    @Column(name = "address", nullable = false, columnDefinition = "TEXT")
    private String address;
    
    // Country-specific fields - only one should be populated based on country
    
    // India
    @Pattern(regexp = "^[0-9]{12}$", message = "Aadhaar must be 12 digits")
    @Column(name = "aadhaar", length = 12)
    private String aadhaar;
    
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$", message = "Invalid PAN format")
    @Column(name = "pan", length = 10)
    private String pan;
    
    @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Invalid Indian mobile number")
    @Column(name = "mobile", length = 15)
    private String mobile;
    
    // USA
    @Pattern(regexp = "^[0-9]{3}-[0-9]{2}-[0-9]{4}$", message = "Invalid SSN format")
    @Column(name = "ssn", length = 11)
    private String ssn;
    
    @Pattern(regexp = "^\\+1[0-9]{10}$", message = "Invalid US phone format")
    @Column(name = "phone", length = 15)
    private String phone;
    
    // UK
    @Pattern(regexp = "^[A-Z]{2}[0-9]{6}[A-Z]{1}$", message = "Invalid NIN format")
    @Column(name = "nin", length = 9)
    private String nin;
    
    public enum Gender {
        Male, Female, Other
    }
}