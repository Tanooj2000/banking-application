package com.example.account_service.repository;

import com.example.account_service.entity.DocumentMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<DocumentMetadata, Long> {
    
    List<DocumentMetadata> findByAccountId(Long accountId);
    
    List<DocumentMetadata> findByAccountIdAndDocumentType(Long accountId, DocumentMetadata.DocumentType documentType);
    
    List<DocumentMetadata> findByAccountIdAndUploadStatus(Long accountId, DocumentMetadata.UploadStatus uploadStatus);
    
    @Query("SELECT d FROM DocumentMetadata d WHERE d.accountId = :accountId AND d.uploadStatus = 'UPLOADED'")
    List<DocumentMetadata> findPendingDocumentsByAccountId(Long accountId);
    
    boolean existsByAccountIdAndDocumentType(Long accountId, DocumentMetadata.DocumentType documentType);
}