package com.example.account_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.example.account_service.entity.DocumentMetadata;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadResponse {
    
    private Long documentId;
    private String accountNumber; 
    private DocumentMetadata.DocumentType documentType;
    private String originalFilename;
    private String storedFilename;
    private Long fileSize;
    private DocumentMetadata.UploadStatus uploadStatus;
    private LocalDateTime uploadedDate;
    private String message;
    private boolean isValid;
    private String validationMessage;
}