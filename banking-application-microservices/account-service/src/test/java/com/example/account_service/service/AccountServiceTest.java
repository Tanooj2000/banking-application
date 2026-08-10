package com.example.account_service.service;

import com.example.account_service.dto.AccountCreationResponse;
import com.example.account_service.dto.DocumentDownloadResponse;
import com.example.account_service.dto.DocumentUploadResponse;
import com.example.account_service.dto.IndiaAccountRequest;
import com.example.account_service.dto.UkAccountRequest;
import com.example.account_service.dto.UsaAccountRequest;
import com.example.account_service.entity.Account;
import com.example.account_service.entity.AccountStatus;
import com.example.account_service.entity.AccountType;
import com.example.account_service.entity.DocumentMetadata;
import com.example.account_service.entity.EducationalDetails;
import com.example.account_service.entity.IncomeDetails;
import com.example.account_service.entity.NomineeDetails;
import com.example.account_service.entity.PersonalDetails;
import com.example.account_service.factory.AccountStrategyFactory;
import com.example.account_service.repository.AccountRepository;
import com.example.account_service.repository.DocumentRepository;
import com.example.account_service.stratergy.AccountCreationStrategy;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AccountService Unit Tests")
class AccountServiceTest {

    @Mock private AccountRepository accountRepository;
    @Mock private DocumentRepository documentRepository;
    @Mock private AccountStrategyFactory strategyFactory;
    @Mock private EmailNotificationService emailNotificationService;
    @Mock private AccountCreationStrategy accountCreationStrategy;

    @InjectMocks
    private AccountService accountService;

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(accountService, "validator", validator);
        ReflectionTestUtils.setField(accountService, "documentUploadPath", "target/test-documents");
        ReflectionTestUtils.setField(accountService, "maxDocumentFileSizeBytes", 5L * 1024L * 1024L);
    }

    private IndiaAccountRequest validIndiaRequest() {
        IndiaAccountRequest request = new IndiaAccountRequest();
        request.setUserId("user1");
        request.setBank("BankA");
        request.setBranch("Branch1");
        request.setFullName("John Doe");
        request.setDob(LocalDate.of(1990, 1, 1));
        request.setGender("Male");
        request.setMobile("9876543210");
        request.setEmail("john@example.com");
        request.setAddress("123 Main Street, Bangalore");
        request.setAadhaar("123456789012");
        request.setPan("ABCDE1234F");
        request.setEducationLevel("Graduate");
        request.setInstitutionName("ABC College");
        request.setCourse("B.Com");
        request.setYearOfCompletion(2012);
        request.setGrade("A");
        request.setEmploymentStatus("Employed");
        request.setEmployerName("ABC Pvt Ltd");
        request.setOccupation("Engineer");
        request.setMonthlyIncome(new BigDecimal("50000.00"));
        request.setAnnualIncome(new BigDecimal("600000.00"));
        request.setIncomeSource("Salary");
        request.setNomineeName("Jane Doe");
        request.setNomineeRelation("Spouse");
        request.setNomineeDob(LocalDate.of(1992, 2, 2));
        request.setNomineeContact("9999999999");
        request.setNomineeAddress("123 Main Street, Bangalore");
        request.setAccountType(AccountType.SAVINGS);
        request.setDeposit(new BigDecimal("1000.00"));
        request.setConsent(true);
        return request;
    }

    private Account buildAccount(Long id, AccountStatus status, String country, String accountNumber) {
        Account account = new Account();
        account.setId(id);
        account.setUserId("user1");
        account.setAccountNumber(accountNumber);
        account.setBank("BankA");
        account.setBranch("Branch1");
        account.setCountry(country);
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(status);
        account.setDeposit(new BigDecimal("1000.00"));
        account.setConsent(true);
        account.setApplicationStage(Account.ApplicationStage.COMPLETE);
        account.setCreatedBy("SYSTEM");
        account.setCreatedDate(LocalDateTime.now());
        account.setPersonalDetails(new PersonalDetails(
            "John Doe", LocalDate.of(1990, 1, 1), PersonalDetails.Gender.Male,
            "john@example.com", "123 Main Street, Bangalore", "123456789012",
            "ABCDE1234F", "9876543210", null, null, null
        ));
        account.setEducationalDetails(new EducationalDetails(
            EducationalDetails.EducationLevel.GRADUATE, "ABC College", "B.Com", 2012, "A"
        ));
        account.setIncomeDetails(new IncomeDetails(
            IncomeDetails.EmploymentStatus.EMPLOYED, "ABC Pvt Ltd", "Engineer",
            new BigDecimal("50000.00"), new BigDecimal("600000.00"),
            IncomeDetails.IncomeSource.SALARY, "INR"
        ));
        account.setNomineeDetails(new NomineeDetails(
            "Jane Doe", NomineeDetails.NomineeRelation.SPOUSE, LocalDate.of(1992, 2, 2),
            "9999999999", "123 Main Street, Bangalore"
        ));
        return account;
    }

    private MockMultipartFile document(String name, String contentType) {
        return new MockMultipartFile("file", name, contentType, "document-content".getBytes(StandardCharsets.UTF_8));
    }

    private DocumentMetadata buildDocument(Long id, Long accountId, DocumentMetadata.DocumentType type, DocumentMetadata.UploadStatus status) {
        DocumentMetadata document = new DocumentMetadata();
        document.setId(id);
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

    private void stubAccountSaveWithId(Long id) {
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> {
            Account account = invocation.getArgument(0);
            if (account.getId() == null) {
                account.setId(id);
            }
            return account;
        });
    }

    private void stubDocumentSaveWithId(Long id) {
        when(documentRepository.save(any(DocumentMetadata.class))).thenAnswer(invocation -> {
            DocumentMetadata document = invocation.getArgument(0);
            if (document.getId() == null) {
                document.setId(id);
            }
            return document;
        });
    }

    @Nested @DisplayName("createAccount()")
    class CreateAccount {

        @Test
        @DisplayName("returns validation errors when request is invalid")
        void validationFails() {
            AccountCreationResponse response = accountService.createAccount(
                "INDIA", new IndiaAccountRequest(),
                document("id-proof.jpg", "image/jpeg"),
                document("address-proof.jpg", "image/jpeg"),
                document("income-proof.jpg", "image/jpeg"),
                document("photo.jpg", "image/jpeg")
            );

            assertThat(response.getMessage()).startsWith("Please correct");
            assertThat(response.getValidationResults()).isNotEmpty();
        }

        @Test
        @DisplayName("creates account and uploads documents successfully")
        void createAccountSuccess() {
            IndiaAccountRequest request = validIndiaRequest();
            Account strategyAccount = buildAccount(null, AccountStatus.PENDING, "INDIA", null);
            strategyAccount.setId(null);

            when(strategyFactory.getStrategy("INDIA")).thenReturn(accountCreationStrategy);
            when(accountCreationStrategy.createAccount(request)).thenReturn(strategyAccount);
            stubAccountSaveWithId(1L);
            stubDocumentSaveWithId(10L);

            AccountCreationResponse response = accountService.createAccount(
                "INDIA", request,
                document("id-proof.jpg", "image/jpeg"),
                document("address-proof.jpg", "image/jpeg"),
                document("income-proof.jpg", "image/jpeg"),
                document("photo.jpg", "image/jpeg")
            );

            assertThat(response.getApplicationId()).isEqualTo("APP-1");
            assertThat(response.getStatus()).isEqualTo(AccountStatus.PENDING);
            assertThat(response.getCountry()).isEqualTo("INDIA");
            assertThat(response.getCompletionPercentage()).isEqualTo(100.0);
            assertThat(response.getMessage()).contains("Application completed successfully");
            verify(emailNotificationService).notifyAdminAccountCreated(any(Account.class));
        }

        @Test
        @DisplayName("returns duplicate account message when account already exists")
        void duplicateAccount() {
            IndiaAccountRequest request = validIndiaRequest();

            when(accountRepository.existsByUserIdAndBankAndBranch("user1", "BankA", "Branch1")).thenReturn(true);

            AccountCreationResponse response = accountService.createAccount(
                "INDIA", request,
                document("id-proof.jpg", "image/jpeg"),
                document("address-proof.jpg", "image/jpeg"),
                document("income-proof.jpg", "image/jpeg"),
                document("photo.jpg", "image/jpeg")
            );

            assertThat(response.getMessage()).contains("already has an account");
            verify(accountRepository, never()).save(any());
        }
    }

    @Nested @DisplayName("uploadDocument()")
    class UploadDocument {

        @Test
        @DisplayName("uploads a document successfully")
        void uploadDocumentSuccess() {
            Account account = buildAccount(1L, AccountStatus.PENDING, "INDIA", "IN0000000001");
            when(accountRepository.findByAccountNumber("IN0000000001")).thenReturn(Optional.of(account));
            stubDocumentSaveWithId(11L);

            DocumentUploadResponse response = accountService.uploadDocument(
                "IN0000000001", document("id-proof.jpg", "image/jpeg"), DocumentMetadata.DocumentType.ID_PROOF);

            assertThat(response.isValid()).isTrue();
            assertThat(response.getDocumentId()).isEqualTo(11L);
            assertThat(response.getAccountNumber()).isEqualTo("IN0000000001");
        }

        @Test
        @DisplayName("returns invalid response when account is missing")
        void uploadDocumentAccountMissing() {
            when(accountRepository.findByAccountNumber("IN0000000001")).thenReturn(Optional.empty());

            DocumentUploadResponse response = accountService.uploadDocument(
                "IN0000000001", document("id-proof.jpg", "image/jpeg"), DocumentMetadata.DocumentType.ID_PROOF);

            assertThat(response.isValid()).isFalse();
            assertThat(response.getMessage()).contains("Account not found");
        }
    }

    @Nested @DisplayName("approveAccount() and rejectAccount()")
    class ApprovalFlow {

        @Test
        @DisplayName("approves pending account when all documents are present")
        void approveAccountSuccess() {
            Account account = buildAccount(1L, AccountStatus.PENDING, "INDIA", null);
            when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
            when(documentRepository.findByAccountId(1L)).thenReturn(List.of(
                buildDocument(1L, 1L, DocumentMetadata.DocumentType.ID_PROOF, DocumentMetadata.UploadStatus.UPLOADED),
                buildDocument(2L, 1L, DocumentMetadata.DocumentType.ADDRESS_PROOF, DocumentMetadata.UploadStatus.UPLOADED),
                buildDocument(3L, 1L, DocumentMetadata.DocumentType.INCOME_PROOF, DocumentMetadata.UploadStatus.UPLOADED),
                buildDocument(4L, 1L, DocumentMetadata.DocumentType.PHOTO, DocumentMetadata.UploadStatus.UPLOADED)
            ));
            stubAccountSaveWithId(1L);

            accountService.approveAccount(1L);

            assertThat(account.getStatus()).isEqualTo(AccountStatus.APPROVED);
            assertThat(account.getAccountNumber()).startsWith("IN");
            verify(emailNotificationService).notifyAccountApproved(account);
        }

        @Test
        @DisplayName("rejects pending account")
        void rejectAccountSuccess() {
            Account account = buildAccount(1L, AccountStatus.PENDING, "INDIA", null);
            when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
            stubAccountSaveWithId(1L);

            accountService.rejectAccount(1L, "Bad docs");

            assertThat(account.getStatus()).isEqualTo(AccountStatus.REJECTED);
            verify(emailNotificationService).notifyAccountRejected(account);
        }
    }

    @Nested @DisplayName("getApplicationStatus()")
    class ApplicationStatusTests {

        @Test
        @DisplayName("returns pending application status")
        void returnsPendingStatus() {
            when(accountRepository.findById(1L)).thenReturn(Optional.of(buildAccount(1L, AccountStatus.PENDING, "INDIA", null)));

            AccountCreationResponse response = accountService.getApplicationStatus("APP-1");

            assertThat(response.getStatus()).isEqualTo(AccountStatus.PENDING);
            assertThat(response.getCompletionPercentage()).isEqualTo(75.0);
        }

        @Test
        @DisplayName("returns approved application status")
        void returnsApprovedStatus() {
            when(accountRepository.findById(1L)).thenReturn(Optional.of(buildAccount(1L, AccountStatus.APPROVED, "INDIA", "IN1234567890")));

            AccountCreationResponse response = accountService.getApplicationStatus("APP-1");

            assertThat(response.getStatus()).isEqualTo(AccountStatus.APPROVED);
            assertThat(response.getAccountNumber()).isEqualTo("IN1234567890");
            assertThat(response.getCompletionPercentage()).isEqualTo(100.0);
        }

        @Test
        @DisplayName("throws for invalid application id format")
        void invalidApplicationIdFormat() {
            try {
                accountService.getApplicationStatus("INVALID");
            } catch (IllegalArgumentException exception) {
                assertThat(exception.getMessage()).contains("Invalid application ID format");
            }
        }
    }

    @Nested @DisplayName("Query methods")
    class QueryMethods {

        @Test
        @DisplayName("returns pending applications")
        void returnsPendingApplications() {
            when(accountRepository.findByStatus(AccountStatus.PENDING)).thenReturn(List.of(buildAccount(1L, AccountStatus.PENDING, "INDIA", null)));

            assertThat(accountService.getPendingApplications()).hasSize(1);
        }

        @Test
        @DisplayName("returns account details")
        void returnsAccountDetails() {
            when(accountRepository.findById(1L)).thenReturn(Optional.of(buildAccount(1L, AccountStatus.PENDING, "INDIA", null)));

            AccountCreationResponse response = accountService.getAccountDetails(1L);

            assertThat(response.getApplicationId()).isEqualTo("APP-1");
            assertThat(response.getMessage()).contains("pending admin approval");
        }

        @Test
        @DisplayName("returns accounts by user id, bank, status and account number")
        void returnsBasicQueries() {
            Account account = buildAccount(1L, AccountStatus.PENDING, "INDIA", "IN1234567890");
            when(accountRepository.findByUserId("user1")).thenReturn(List.of(account));
            when(accountRepository.findByBank("BankA")).thenReturn(List.of(account));
            when(accountRepository.findByStatus(AccountStatus.PENDING)).thenReturn(List.of(account));
            when(accountRepository.findByAccountNumber("IN1234567890")).thenReturn(Optional.of(account));

            assertThat(accountService.getAccountsByUserId("user1")).hasSize(1);
            assertThat(accountService.getAccountsByBankName("BankA")).hasSize(1);
            assertThat(accountService.getAccountsByStatus(AccountStatus.PENDING)).hasSize(1);
            assertThat(accountService.getAccountByNumber("IN1234567890")).isPresent();
        }

        @Test
        @DisplayName("returns documents by account, account id and user id")
        void returnsDocumentQueries() {
            Account account = buildAccount(1L, AccountStatus.PENDING, "INDIA", "IN1234567890");
            when(accountRepository.findByAccountNumber("IN1234567890")).thenReturn(Optional.of(account));
            when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
            when(accountRepository.findByUserId("user1")).thenReturn(List.of(account));
            when(documentRepository.findByAccountId(1L)).thenReturn(List.of(buildDocument(1L, 1L, DocumentMetadata.DocumentType.ID_PROOF, DocumentMetadata.UploadStatus.UPLOADED)));

            assertThat(accountService.getAccountDocuments("IN1234567890")).hasSize(1);
            assertThat(accountService.getAccountDocumentsById(1L)).hasSize(1);
            assertThat(accountService.getUserDocuments("user1")).hasSize(1);
        }

        @Test
        @DisplayName("downloads an existing document")
        void downloadsDocument() throws IOException {
            Path tempFile = Files.createTempFile("account-service-test", ".pdf");
            Files.writeString(tempFile, "document-content", StandardCharsets.UTF_8);

            DocumentMetadata document = buildDocument(1L, 1L, DocumentMetadata.DocumentType.ID_PROOF, DocumentMetadata.UploadStatus.UPLOADED);
            document.setFilePath(tempFile.toString());
            when(documentRepository.findById(1L)).thenReturn(Optional.of(document));

            DocumentDownloadResponse response = accountService.downloadDocument(1L);

            Resource resource = response.getResource();
            assertThat(response.getOriginalFilename()).isEqualTo("id_proof.pdf");
            assertThat(resource.exists()).isTrue();
        }
    }
}