package com.example.account_service.controller;

import com.example.account_service.dto.AccountCreationResponse;
import com.example.account_service.dto.DocumentDownloadResponse;
import com.example.account_service.dto.DocumentUploadResponse;
import com.example.account_service.entity.Account;
import com.example.account_service.entity.AccountStatus;
import com.example.account_service.entity.AccountType;
import com.example.account_service.entity.DocumentMetadata;
import com.example.account_service.service.AccountService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AccountController.class)
@DisplayName("AccountController Tests")
class AccountControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private AccountService accountService;

    private MockMultipartFile document(String partName, String name, String contentType) {
        return new MockMultipartFile(partName, name, contentType, "content".getBytes(StandardCharsets.UTF_8));
    }

    private AccountCreationResponse creationResponse(String applicationId, AccountStatus status, String country) {
        AccountCreationResponse response = new AccountCreationResponse();
        response.setApplicationId(applicationId);
        response.setStatus(status);
        response.setCountry(country);
        response.setApplicationStage("Complete");
        response.setCompletionPercentage(100.0);
        response.setMessage("Application completed successfully");
        response.setRequiredDocuments(List.of("ID Proof", "Address Proof", "Income Proof", "Photo"));
        response.setNextSteps(List.of("Wait for admin approval"));
        return response;
    }

    private Account account(Long id, String userId, String bank, String branch, String country, AccountStatus status) {
        Account account = new Account();
        account.setId(id);
        account.setUserId(userId);
        account.setAccountNumber("IN0000000001");
        account.setBank(bank);
        account.setBranch(branch);
        account.setCountry(country);
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(status);
        account.setDeposit(new BigDecimal("1000.00"));
        account.setConsent(true);
        account.setApplicationStage(Account.ApplicationStage.COMPLETE);
        account.setCreatedBy("SYSTEM");
        account.setCreatedDate(LocalDateTime.now());
        return account;
    }

    private DocumentMetadata documentMetadata(Long id) {
        DocumentMetadata document = new DocumentMetadata();
        document.setId(id);
        document.setAccountId(1L);
        document.setDocumentType(DocumentMetadata.DocumentType.ID_PROOF);
        document.setOriginalFilename("id-proof.jpg");
        document.setStoredFilename("stored-id-proof.jpg");
        document.setFilePath("target/test-documents/id-proof.jpg");
        document.setFileSize(100L);
        document.setContentType("image/jpeg");
        document.setUploadStatus(DocumentMetadata.UploadStatus.UPLOADED);
        return document;
    }

    @Nested @DisplayName("Create account endpoints")
    class CreateAccountEndpoints {

        @Test
        @DisplayName("creates India account successfully")
        void createIndiaAccountSuccess() throws Exception {
            when(accountService.createAccount(eq("INDIA"), any(), any(), any(), any(), any()))
                .thenReturn(creationResponse("APP-1", AccountStatus.PENDING, "INDIA"));

            mockMvc.perform(multipart("/api/accounts/create/india")
                    .file(document("idProof", "id-proof.jpg", "image/jpeg"))
                    .file(document("addressProof", "address-proof.jpg", "image/jpeg"))
                    .file(document("incomeProof", "income-proof.jpg", "image/jpeg"))
                    .file(document("photo", "photo.jpg", "image/jpeg")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicationId").value("APP-1"));
        }

        @Test
        @DisplayName("rejects account creation when documents are missing")
        void createIndiaAccountMissingDocuments() throws Exception {
            mockMvc.perform(multipart("/api/accounts/create/india")
                    .file(document("idProof", "id-proof.jpg", "image/jpeg")))
            .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("creates USA account successfully")
        void createUsaAccountSuccess() throws Exception {
            when(accountService.createAccount(eq("USA"), any(), any(), any(), any(), any()))
                .thenReturn(creationResponse("APP-2", AccountStatus.PENDING, "USA"));

            mockMvc.perform(multipart("/api/accounts/create/usa")
                    .file(document("idProof", "id-proof.jpg", "image/jpeg"))
                    .file(document("addressProof", "address-proof.jpg", "image/jpeg"))
                    .file(document("incomeProof", "income-proof.jpg", "image/jpeg"))
                    .file(document("photo", "photo.jpg", "image/jpeg")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicationId").value("APP-2"));
        }

        @Test
        @DisplayName("creates UK account successfully")
        void createUkAccountSuccess() throws Exception {
            when(accountService.createAccount(eq("UK"), any(), any(), any(), any(), any()))
                .thenReturn(creationResponse("APP-3", AccountStatus.PENDING, "UK"));

            mockMvc.perform(multipart("/api/accounts/create/uk")
                    .file(document("idProof", "id-proof.jpg", "image/jpeg"))
                    .file(document("addressProof", "address-proof.jpg", "image/jpeg"))
                    .file(document("incomeProof", "income-proof.jpg", "image/jpeg"))
                    .file(document("photo", "photo.jpg", "image/jpeg")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicationId").value("APP-3"));
        }

        @Test
        @DisplayName("rejects legacy create endpoint")
        void legacyCreateEndpointRejected() throws Exception {
            mockMvc.perform(post("/api/accounts/create/france")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Documents are required")));
        }
    }

    @Nested @DisplayName("Document endpoints")
    class DocumentEndpoints {

        @Test
        @DisplayName("uploads a document successfully")
        void uploadDocumentSuccess() throws Exception {
            DocumentUploadResponse response = new DocumentUploadResponse(1L, "IN0000000001", DocumentMetadata.DocumentType.ID_PROOF,
                "id-proof.jpg", "stored-id-proof.jpg", 100L, DocumentMetadata.UploadStatus.UPLOADED,
                LocalDateTime.now(), "Document uploaded successfully", true, "Document ready for verification");
            when(accountService.uploadDocument(eq("IN0000000001"), any(), eq(DocumentMetadata.DocumentType.ID_PROOF))).thenReturn(response);

            mockMvc.perform(multipart("/api/accounts/IN0000000001/documents")
                    .file(document("file", "id-proof.jpg", "image/jpeg"))
                    .param("documentType", "ID_PROOF"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.documentId").value(1L));
        }

        @Test
        @DisplayName("returns application status")
        void getApplicationStatus() throws Exception {
            when(accountService.getApplicationStatus("APP-1")).thenReturn(creationResponse("APP-1", AccountStatus.PENDING, "INDIA"));

            mockMvc.perform(get("/api/accounts/status/APP-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicationId").value("APP-1"));
        }

        @Test
        @DisplayName("returns account details")
        void getAccountDetails() throws Exception {
            when(accountService.getAccountDetails(1L)).thenReturn(creationResponse("APP-1", AccountStatus.PENDING, "INDIA"));

            mockMvc.perform(get("/api/accounts/admin/details/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicationId").value("APP-1"));
        }

        @Test
        @DisplayName("approves account successfully")
        void approveAccount() throws Exception {
            when(accountService.getAccountDetails(1L)).thenReturn(creationResponse("APP-1", AccountStatus.APPROVED, "INDIA"));

            mockMvc.perform(post("/api/accounts/approve/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString("Account approved successfully")));
        }

        @Test
        @DisplayName("rejects account successfully")
        void rejectAccount() throws Exception {
            mockMvc.perform(post("/api/accounts/reject/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Account rejected successfully"));
        }

        @Test
        @DisplayName("downloads document successfully")
        void downloadDocument() throws Exception {
            Resource resource = new ByteArrayResource("content".getBytes(StandardCharsets.UTF_8));
            when(accountService.downloadDocument(1L)).thenReturn(new DocumentDownloadResponse("id-proof.jpg", "image/jpeg", 100L, resource));

            mockMvc.perform(get("/api/accounts/documents/1/download"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("id-proof.jpg")));
        }

        @Test
        @DisplayName("views document successfully")
        void viewDocument() throws Exception {
            Resource resource = new ByteArrayResource("content".getBytes(StandardCharsets.UTF_8));
            when(accountService.downloadDocument(1L)).thenReturn(new DocumentDownloadResponse("id-proof.jpg", "image/jpeg", 100L, resource));

            mockMvc.perform(get("/api/accounts/documents/1/view"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("inline")));
        }
    }

    @Nested @DisplayName("Query endpoints")
    class QueryEndpoints {

        @Test
        @DisplayName("returns accounts by user id")
        void getAccountsByUserId() throws Exception {
            when(accountService.getAccountsByUserId("user1")).thenReturn(List.of(account(1L, "user1", "BankA", "Branch1", "INDIA", AccountStatus.PENDING)));

            mockMvc.perform(get("/api/accounts/user/user1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value("user1"));
        }

        @Test
        @DisplayName("returns no content when user has no accounts")
        void getAccountsByUserIdNoContent() throws Exception {
            when(accountService.getAccountsByUserId("ghost")).thenReturn(List.of());

            mockMvc.perform(get("/api/accounts/user/ghost"))
                .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("returns accounts by bank name")
        void getAccountsByBankName() throws Exception {
            when(accountService.getAccountsByBankName("BankA")).thenReturn(List.of(account(1L, "user1", "BankA", "Branch1", "INDIA", AccountStatus.PENDING)));

            mockMvc.perform(get("/api/accounts/bank/BankA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].bank").value("BankA"));
        }

        @Test
        @DisplayName("returns accounts by status")
        void getAccountsByStatus() throws Exception {
            when(accountService.getAccountsByStatus(AccountStatus.PENDING)).thenReturn(List.of(account(1L, "user1", "BankA", "Branch1", "INDIA", AccountStatus.PENDING)));

            mockMvc.perform(get("/api/accounts/status/PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("PENDING"));
        }

        @Test
        @DisplayName("returns bad request for invalid status")
        void getAccountsByStatusInvalid() throws Exception {
            mockMvc.perform(get("/api/accounts/status/INVALID"))
                .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("returns account by account number")
        void getAccountByNumber() throws Exception {
            when(accountService.getAccountByNumber("IN0000000001")).thenReturn(Optional.of(account(1L, "user1", "BankA", "Branch1", "INDIA", AccountStatus.PENDING)));

            mockMvc.perform(get("/api/accounts/account/IN0000000001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountNumber").value("IN0000000001"));
        }

        @Test
        @DisplayName("returns account types for country")
        void getAccountTypesForCountry() throws Exception {
            mockMvc.perform(get("/api/accounts/countries/india/account-types"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("SAVINGS")));
        }

        @Test
        @DisplayName("returns documents for account number")
        void getAccountDocuments() throws Exception {
            when(accountService.getAccountDocuments("IN0000000001")).thenReturn(List.of(documentMetadata(1L)));

            mockMvc.perform(get("/api/accounts/account/IN0000000001/documents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L));
        }

        @Test
        @DisplayName("returns bad request for documents by account id when account is invalid")
        void getAccountDocumentsByIdBadRequest() throws Exception {
            when(accountService.getAccountDocumentsById(1L)).thenReturn(List.of(documentMetadata(1L)));

            mockMvc.perform(get("/api/accounts/account-id/1/documents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L));
        }

        @Test
        @DisplayName("returns no content for user documents when empty")
        void getUserDocumentsNoContent() throws Exception {
            when(accountService.getUserDocuments("user1")).thenReturn(List.of());

            mockMvc.perform(get("/api/accounts/user/user1/documents"))
                .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("returns account list for admin pending applications")
        void getPendingApplications() throws Exception {
            when(accountService.getPendingApplications()).thenReturn(List.of(account(1L, "user1", "BankA", "Branch1", "INDIA", AccountStatus.PENDING)));

            mockMvc.perform(get("/api/accounts/admin/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("PENDING"));
        }
    }
}