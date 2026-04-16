package com.example.account_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_metadata")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentMetadata {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull
    @Column(name = "account_id", nullable = false)
    private Long accountId;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    private DocumentType documentType;
    
    @NotBlank
    @Size(max = 255)
    @Column(name = "original_filename", nullable = false)
    private String originalFilename;
    
    @NotBlank
    @Size(max = 255)
    @Column(name = "stored_filename", nullable = false)
    private String storedFilename;
    
    @NotBlank
    @Size(max = 500)
    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;
    
    @NotNull
    @Min(1)
    @Column(name = "file_size", nullable = false)
    private Long fileSize;
    
    @NotBlank
    @Size(max = 100)
    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "upload_status")
    private UploadStatus uploadStatus = UploadStatus.UPLOADED;
    
    @Size(max = 1000)
    @Column(name = "verification_notes", columnDefinition = "TEXT")
    private String verificationNotes;
    
    @CreationTimestamp
    @Column(name = "uploaded_date", updatable = false)
    private LocalDateTime uploadedDate;
    
    @Column(name = "verified_date")
    private LocalDateTime verifiedDate;
    
    @Size(max = 50)
    @Column(name = "verified_by", length = 50)
    private String verifiedBy;
    
    public enum DocumentType {
        ID_PROOF("ID Proof"),
        ADDRESS_PROOF("Address Proof"), 
        INCOME_PROOF("Income Proof"),
        PHOTO("Photo");
        
        private final String displayName;
        
        DocumentType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    public enum UploadStatus {
        UPLOADED("Uploaded"),
        VERIFIED("Verified"),
        REJECTED("Rejected");
        
        private final String displayName;
        
        UploadStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}