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
public class NomineeDetails {
    
    @NotBlank
    @Size(min = 2, max = 100)
    @Column(name = "nominee_name", nullable = false, length = 100)
    private String nomineeName;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "nominee_relation", nullable = false)
    private NomineeRelation nomineeRelation;
    
    @NotNull
    @Past
    @Column(name = "nominee_dob", nullable = false)
    private LocalDate nomineeDob;
    
    @NotBlank
    @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Invalid contact number")
    @Column(name = "nominee_contact", nullable = false, length = 15)
    private String nomineeContact;
    
    @NotBlank
    @Size(min = 10, max = 500)
    @Column(name = "nominee_address", nullable = false, columnDefinition = "TEXT")
    private String nomineeAddress;
    
    public enum NomineeRelation {
        SPOUSE("Spouse"),
        FATHER("Father"),
        MOTHER("Mother"),
        SON("Son"), 
        DAUGHTER("Daughter"),
        BROTHER("Brother"),
        SISTER("Sister"),
        OTHER("Other");
        
        private final String displayName;
        
        NomineeRelation(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}