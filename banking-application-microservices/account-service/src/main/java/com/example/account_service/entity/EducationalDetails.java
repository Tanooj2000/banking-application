package com.example.account_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EducationalDetails {
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "education_level", nullable = false)
    private EducationLevel educationLevel;
    
    @NotBlank
    @Size(min = 2, max = 200)
    @Column(name = "institution_name", nullable = false, length = 200)
    private String institutionName;
    
    @NotBlank
    @Size(min = 2, max = 150)
    @Column(name = "course", nullable = false, length = 150)
    private String course;
    
    @NotNull
    @Min(value = 1950)
    @Max(value = 2030)
    @Column(name = "year_of_completion", nullable = false)
    private Integer yearOfCompletion;
    
    @Size(max = 20)
    @Column(name = "grade", length = 20)
    private String grade;
    
    public enum EducationLevel {
        // Common
        HIGH_SCHOOL("High School"),
        DIPLOMA("Diploma"), 
        GRADUATE("Graduate"),
        POST_GRADUATE("Post Graduate"),
        PROFESSIONAL("Professional"),
        
        // USA specific
        ASSOCIATE_DEGREE("Associate Degree"),
        BACHELOR_DEGREE("Bachelor Degree"),
        MASTER_DEGREE("Master Degree"),
        DOCTORAL_DEGREE("Doctoral Degree"),
        
        // UK specific  
        GCSE("GCSE"),
        A_LEVELS("A-Levels"),
        UNDERGRADUATE_DEGREE("Undergraduate Degree"),
        POSTGRADUATE_DEGREE("Postgraduate Degree"),
        PROFESSIONAL_QUALIFICATION("Professional Qualification");
        
        private final String displayName;
        
        EducationLevel(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}