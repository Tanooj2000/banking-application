package com.example.account_service.repository;

import com.example.account_service.entity.DocumentMetadata;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@DisplayName("DocumentRepository Tests")
class DocumentRepositoryTest {

    @Autowired
    private DocumentRepository documentRepository;

    private DocumentMetadata buildDocument(Long accountId, DocumentMetadata.DocumentType type, DocumentMetadata.UploadStatus status) {
        DocumentMetadata document = new DocumentMetadata();
        document.setAccountId(accountId);
        document.setDocumentType(type);
        document.setOriginalFilename(type.name().toLowerCase() + ".pdf");
        document.setStoredFilename("stored-" + type.name().toLowerCase() + ".pdf");
        document.setFilePath("target/test-documents/" + type.name().toLowerCase() + ".pdf");
        document.setFileSize(1024L);
        document.setContentType("application/pdf");
        document.setUploadStatus(status);
        return document;
    }

    @Test
    @DisplayName("save persists a new document")
    void savePersistsNewDocument() {
        DocumentMetadata saved = documentRepository.save(buildDocument(1L, DocumentMetadata.DocumentType.ID_PROOF, DocumentMetadata.UploadStatus.UPLOADED));

        assertThat(saved.getId()).isNotNull();
        assertThat(documentRepository.findById(saved.getId())).isPresent();
    }

    @Test
    @DisplayName("findByAccountId returns matching documents")
    void findByAccountIdReturnsMatchingDocuments() {
        documentRepository.save(buildDocument(1L, DocumentMetadata.DocumentType.ID_PROOF, DocumentMetadata.UploadStatus.UPLOADED));

        assertThat(documentRepository.findByAccountId(1L)).hasSize(1);
    }

    @Test
    @DisplayName("findByAccountIdAndDocumentType returns matching documents")
    void findByAccountIdAndDocumentTypeReturnsMatchingDocuments() {
        documentRepository.save(buildDocument(1L, DocumentMetadata.DocumentType.ID_PROOF, DocumentMetadata.UploadStatus.UPLOADED));

        assertThat(documentRepository.findByAccountIdAndDocumentType(1L, DocumentMetadata.DocumentType.ID_PROOF)).hasSize(1);
    }

    @Test
    @DisplayName("findByAccountIdAndUploadStatus returns matching documents")
    void findByAccountIdAndUploadStatusReturnsMatchingDocuments() {
        documentRepository.save(buildDocument(1L, DocumentMetadata.DocumentType.ID_PROOF, DocumentMetadata.UploadStatus.UPLOADED));

        assertThat(documentRepository.findByAccountIdAndUploadStatus(1L, DocumentMetadata.UploadStatus.UPLOADED)).hasSize(1);
    }

    @Test
    @DisplayName("findPendingDocumentsByAccountId returns uploaded documents")
    void findPendingDocumentsByAccountIdReturnsUploadedDocuments() {
        documentRepository.save(buildDocument(1L, DocumentMetadata.DocumentType.ID_PROOF, DocumentMetadata.UploadStatus.UPLOADED));

        assertThat(documentRepository.findPendingDocumentsByAccountId(1L)).hasSize(1);
    }

    @Test
    @DisplayName("existsByAccountIdAndDocumentType returns true for duplicate document")
    void existsByAccountIdAndDocumentTypeReturnsTrue() {
        documentRepository.save(buildDocument(1L, DocumentMetadata.DocumentType.ID_PROOF, DocumentMetadata.UploadStatus.UPLOADED));

        assertThat(documentRepository.existsByAccountIdAndDocumentType(1L, DocumentMetadata.DocumentType.ID_PROOF)).isTrue();
    }
}