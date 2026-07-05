package com.example.account_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import com.example.account_service.dto.*;
import com.example.account_service.entity.*;
import com.example.account_service.factory.AccountStrategyFactory;
import com.example.account_service.repository.AccountRepository;
import com.example.account_service.repository.DocumentRepository;
import com.example.account_service.stratergy.AccountCreationStrategy;

import jakarta.validation.Validator;
import jakarta.validation.ConstraintViolation;

import java.util.*;
import java.util.stream.Collectors;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class AccountService {
    
    @Autowired
    private AccountRepository accountRepository;
    
    @Autowired
    private DocumentRepository documentRepository;
    
    @Autowired
    private AccountStrategyFactory strategyFactory;
    
    @Autowired
    private EmailNotificationService emailNotificationService;
    
    @Autowired
    private Validator validator;
    
    @Value("${app.document-storage.path:uploads/documents}")
    private String documentUploadPath;

    @Value("${app.document-storage.max-file-size-bytes:5242880}")
    private long maxDocumentFileSizeBytes;
    
    // Account creation - ALWAYS requires documents (no option without documents)
    public AccountCreationResponse createAccount(String country, Object requestDto,
            MultipartFile idProof, MultipartFile addressProof, MultipartFile incomeProof, MultipartFile photo) {
        try {
            // Validate country-specific DTO
            Set<ConstraintViolation<Object>> violations = validator.validate(requestDto);
            AccountCreationResponse response = new AccountCreationResponse();
            
            if (!violations.isEmpty()) {
                // Log validation errors for debugging
                System.out.println("=== VALIDATION ERRORS ===");
                violations.forEach(v -> {
                    System.out.println("Field: " + v.getPropertyPath() + 
                                     " | Value: '" + v.getInvalidValue() + 
                                     "' | Error: " + v.getMessage());
                });
                
                response.setValidationResults(buildValidationResults(violations));
                
                // Build a comprehensive error message for frontend
                StringBuilder detailedMessage = new StringBuilder("Please correct the following errors:\\n");
                Map<String, AccountCreationResponse.ValidationResult> results = buildValidationResults(violations);
                results.forEach((section, result) -> {
                    detailedMessage.append("\\n").append(section.toUpperCase()).append(" SECTION:\\n");
                    result.getErrors().forEach(error -> {
                        detailedMessage.append("• ").append(error).append("\\n");
                    });
                });
                
                response.setMessage(detailedMessage.toString());
                return response;
            }
            
            // Validate documents before creating the account so a failed upload cannot leave a partial application.
            if (idProof.isEmpty() || addressProof.isEmpty() || incomeProof.isEmpty() || photo.isEmpty()) {
                response.setMessage("All documents (ID Proof, Address Proof, Income Proof, Photo) are required");
                return response;
            }

            List<String> documentValidationErrors = validateAccountCreationDocuments(idProof, addressProof, incomeProof, photo);
            if (!documentValidationErrors.isEmpty()) {
                response.setMessage("Please correct document upload errors: " + String.join("; ", documentValidationErrors));
                return response;
            }
            
            // Check for duplicate account
            String userId = extractUserId(requestDto);
            String bank = extractBank(requestDto);
            String branch = extractBranch(requestDto);
            
            if (accountRepository.existsByUserIdAndBankAndBranch(userId, bank, branch)) {
                response.setMessage("User already has an account in " + bank + " - " + branch);
                return response;
            }
            
            // Create account using strategy pattern
            AccountCreationStrategy strategy = strategyFactory.getStrategy(country);
            Account account = strategy.createAccount(requestDto);
            
            // Set system fields
            account.setUserId(userId);
            account.setBank(bank); // Fixed: Added missing bank field
            account.setBranch(branch);
            account.setCountry(country.toUpperCase());
            account.setApplicationStage(Account.ApplicationStage.COMPLETE);
            account.setCreatedBy("SYSTEM");
            
            // DON'T generate account number yet - only after approval
            account.setAccountNumber(null); // Will be generated during approval process
            
            // Save account first
            Account savedAccount = accountRepository.save(account);
            
            // Upload documents
            List<DocumentUploadResponse> documentResponses = new ArrayList<>();
            
            // Upload ID Proof
            DocumentUploadResponse idProofResponse = uploadDocumentForAccount(
                savedAccount, idProof, DocumentMetadata.DocumentType.ID_PROOF);
            documentResponses.add(idProofResponse);
            
            // Upload Address Proof
            DocumentUploadResponse addressProofResponse = uploadDocumentForAccount(
                savedAccount, addressProof, DocumentMetadata.DocumentType.ADDRESS_PROOF);
            documentResponses.add(addressProofResponse);
            
            // Upload Income Proof
            DocumentUploadResponse incomeProofResponse = uploadDocumentForAccount(
                savedAccount, incomeProof, DocumentMetadata.DocumentType.INCOME_PROOF);
            documentResponses.add(incomeProofResponse);
            
            // Upload Photo
            DocumentUploadResponse photoResponse = uploadDocumentForAccount(
                savedAccount, photo, DocumentMetadata.DocumentType.PHOTO);
            documentResponses.add(photoResponse);
            
            // Check if all documents uploaded successfully
            boolean allDocumentsUploaded = documentResponses.stream().allMatch(DocumentUploadResponse::isValid);
            
            if (allDocumentsUploaded) {
                // Update account status to indicate documents are uploaded
                savedAccount.setStatus(AccountStatus.PENDING);
                savedAccount = accountRepository.save(savedAccount);
                
                // Build successful response
                response.setAccountNumber(null); // No account number yet
                response.setApplicationId("APP-" + savedAccount.getId()); // Application tracking ID
                response.setUserId(savedAccount.getUserId());
                response.setStatus(savedAccount.getStatus());
                response.setCountry(savedAccount.getCountry());
                response.setCreatedDate(savedAccount.getCreatedDate());
                response.setApplicationStage(savedAccount.getApplicationStage().getDisplayName());
                response.setCompletionPercentage(100.0);
                response.setMessage("Application completed successfully with all documents uploaded. Your application ID is APP-" + savedAccount.getId() + ". Now pending admin verification and approval.");
                response.setRequiredDocuments(getRequiredDocumentTypes());
                response.setNextSteps(Arrays.asList("Wait for admin approval", "Check application status using your Application ID", "Admin will review your documents and approve", "Account number will be provided after approval"));
                
                // Send admin notification
                emailNotificationService.notifyAdminAccountCreated(savedAccount);
                
            } else {
                // If document upload failed, mark account but show warnings
                response.setAccountNumber(null); // No account number for failed applications
                response.setApplicationId("APP-" + savedAccount.getId()); // Application tracking ID
                response.setUserId(savedAccount.getUserId());
                response.setStatus(savedAccount.getStatus());
                response.setCountry(savedAccount.getCountry());
                response.setCreatedDate(savedAccount.getCreatedDate());
                response.setApplicationStage(savedAccount.getApplicationStage().getDisplayName());
                response.setCompletionPercentage(75.0);
                
                // Check which documents failed
                List<String> failedDocuments = new ArrayList<>();
                for (DocumentUploadResponse docResponse : documentResponses) {
                    if (!docResponse.isValid()) {
                        failedDocuments.add(docResponse.getDocumentType().name());
                    }
                }
                
                response.setMessage("Account created but some documents failed to upload: " + 
                    String.join(", ", failedDocuments) + ". Please re-upload these documents.");
                response.setRequiredDocuments(getRequiredDocumentTypes());
                response.setNextSteps(Arrays.asList("Re-upload failed documents", "Wait for admin approval"));
            }
            
            return response;
            
        } catch (Exception e) {
            AccountCreationResponse errorResponse = new AccountCreationResponse();
            errorResponse.setMessage("Account creation with documents failed: " + e.getMessage());
            return errorResponse;
        }
    }
    
    // Helper method for document upload during account creation
    private DocumentUploadResponse uploadDocumentForAccount(Account account, MultipartFile file, 
            DocumentMetadata.DocumentType documentType) {
        try {
            validateDocumentFile(file, documentType);
            
            // Create upload directory if not exists
            Path uploadDir = Paths.get(documentUploadPath).toAbsolutePath().normalize();
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            
            // Generate unique filename
            String storedFilename = generateUniqueFilename(file.getOriginalFilename(), account.getId());
            Path filePath = uploadDir.resolve(storedFilename).normalize();
            if (!filePath.startsWith(uploadDir)) {
                throw new IllegalArgumentException("Invalid document storage path");
            }
            
            // Save file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Save document metadata
            DocumentMetadata document = new DocumentMetadata();
            document.setAccountId(account.getId());
            document.setDocumentType(documentType);
            document.setOriginalFilename(file.getOriginalFilename());
            document.setStoredFilename(storedFilename);
            document.setFilePath(filePath.toString());
            document.setFileSize(file.getSize());
            document.setContentType(file.getContentType());
            document.setUploadStatus(DocumentMetadata.UploadStatus.UPLOADED);
            
            DocumentMetadata savedDocument = documentRepository.save(document);
            
            return new DocumentUploadResponse(
                savedDocument.getId(),
                account.getAccountNumber(),
                documentType,
                file.getOriginalFilename(),
                storedFilename,
                file.getSize(),
                savedDocument.getUploadStatus(),
                savedDocument.getUploadedDate(),
                "Document uploaded successfully",
                true,
                "Document ready for verification"
            );
            
        } catch (Exception e) {
            return new DocumentUploadResponse(null, account.getAccountNumber(), documentType, 
                file.getOriginalFilename(), null, file.getSize(), DocumentMetadata.UploadStatus.REJECTED, null, 
                "Upload failed: " + e.getMessage(), false, "Please try uploading again");
        }
    }
    
    // Document upload handling
    public DocumentUploadResponse uploadDocument(String accountNumber, MultipartFile file, DocumentMetadata.DocumentType documentType) {
        try {
            Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
            
            validateDocumentFile(file, documentType);
            
            // Create upload directory if not exists
            Path uploadDir = Paths.get(documentUploadPath).toAbsolutePath().normalize();
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            
            // Generate unique filename
            String storedFilename = generateUniqueFilename(file.getOriginalFilename(), account.getId());
            Path filePath = uploadDir.resolve(storedFilename).normalize();
            if (!filePath.startsWith(uploadDir)) {
                throw new IllegalArgumentException("Invalid document storage path");
            }
            
            // Save file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Save document metadata
            DocumentMetadata document = new DocumentMetadata();
            document.setAccountId(account.getId());
            document.setDocumentType(documentType);
            document.setOriginalFilename(file.getOriginalFilename());
            document.setStoredFilename(storedFilename);
            document.setFilePath(filePath.toString());
            document.setFileSize(file.getSize());
            document.setContentType(file.getContentType());
            document.setUploadStatus(DocumentMetadata.UploadStatus.UPLOADED);
            
            DocumentMetadata savedDocument = documentRepository.save(document);
            
            return new DocumentUploadResponse(savedDocument.getId(), accountNumber, documentType,
                file.getOriginalFilename(), storedFilename, file.getSize(),
                DocumentMetadata.UploadStatus.UPLOADED, savedDocument.getUploadedDate(),
                "Document uploaded successfully", true, "Document verified");
            
        } catch (Exception e) {
            return new DocumentUploadResponse(null, accountNumber, documentType, 
                file != null ? file.getOriginalFilename() : null, null, 0L,
                DocumentMetadata.UploadStatus.REJECTED, null, "Upload failed: " + e.getMessage(), false, e.getMessage());
        }
    }
    
    // Account approval with enhanced checks
    public void approveAccount(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
                
        if (account.getStatus() != AccountStatus.PENDING) {
            throw new IllegalArgumentException("Account can only be approved from PENDING status");
        }
        
        // Check if all required documents are uploaded
        if (!allRequiredDocumentsUploaded(accountId)) {
            throw new IllegalArgumentException("All required documents must be uploaded before approval");
        }
        
        // Generate account number ONLY during approval 
        if (account.getAccountNumber() == null) {
            account.setAccountNumber(generateAccountNumber(account.getCountry()));
        }
        
        account.setStatus(AccountStatus.APPROVED);
        accountRepository.save(account);
        
        emailNotificationService.notifyAccountApproved(account);
    }
    
    // Check application status by application ID
    public AccountCreationResponse getApplicationStatus(String applicationId) {
        // Extract account ID from application ID (format: "APP-123")
        if (!applicationId.startsWith("APP-")) {
            throw new IllegalArgumentException("Invalid application ID format");
        }
        
        Long accountId = Long.parseLong(applicationId.substring(4));
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        
        AccountCreationResponse response = new AccountCreationResponse();
        response.setApplicationId(applicationId);
        response.setUserId(account.getUserId());
        response.setStatus(account.getStatus());
        response.setCountry(account.getCountry());
        response.setCreatedDate(account.getCreatedDate());
        response.setApplicationStage(account.getApplicationStage().getDisplayName());
        
        // Set account number only if approved
        if (account.getStatus() == AccountStatus.APPROVED && account.getAccountNumber() != null) {
            response.setAccountNumber(account.getAccountNumber());
            response.setCompletionPercentage(100.0);
            response.setMessage("Your account has been approved! Account Number: " + account.getAccountNumber());
            response.setNextSteps(Arrays.asList("Start using your account", "Download account details"));
        } else if (account.getStatus() == AccountStatus.PENDING) {
            response.setAccountNumber(null);
            response.setCompletionPercentage(75.0);
            response.setMessage("Your application is under review. Please wait for approval.");
            response.setNextSteps(Arrays.asList("Wait for admin approval", "Check status later"));
        } else if (account.getStatus() == AccountStatus.REJECTED) {
            response.setAccountNumber(null);
            response.setCompletionPercentage(0.0);
            response.setMessage("Your application has been rejected. Please contact customer service.");
            response.setNextSteps(Arrays.asList("Contact customer service", "Submit new application"));
        }
        
        return response;
    }
    
    // Enhanced admin methods
    public List<Account> getPendingApplications() {
        return accountRepository.findByStatus(AccountStatus.PENDING);
    }
    
    public AccountCreationResponse getAccountDetails(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        
        AccountCreationResponse response = new AccountCreationResponse();
        response.setApplicationId("APP-" + account.getId());
        response.setAccountNumber(account.getAccountNumber());
        response.setUserId(account.getUserId());
        response.setStatus(account.getStatus());
        response.setCountry(account.getCountry());
        response.setCreatedDate(account.getCreatedDate());
        response.setApplicationStage(account.getApplicationStage().getDisplayName());
        
        if (account.getStatus() == AccountStatus.PENDING) {
            response.setMessage("Application pending admin approval");
            response.setCompletionPercentage(90.0);
        } else if (account.getStatus() == AccountStatus.APPROVED) {
            response.setMessage("Account approved and active");
            response.setCompletionPercentage(100.0);
        } else {
            response.setMessage("Account rejected");
            response.setCompletionPercentage(0.0);
        }
        
        return response;
    }
    
    public void rejectAccount(Long accountId, String reason) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));
                
        if (account.getStatus() != AccountStatus.PENDING) {
            throw new IllegalArgumentException("Account can only be rejected from PENDING status");
        }
        
        account.setStatus(AccountStatus.REJECTED);
        accountRepository.save(account);
        
        emailNotificationService.notifyAccountRejected(account);
    }
    
    public List<Account> getAccountsByUserId(String userId) {
        return accountRepository.findByUserId(userId);
    }
    
    public List<Account> getAccountsByBankName(String bankName) {
        return accountRepository.findByBank(bankName);
    }
    
    public List<Account> getAccountsByStatus(AccountStatus status) {
        return accountRepository.findByStatus(status);
    }
    
    public Optional<Account> getAccountByNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber);
    }
    
    // Helper methods
    private String generateAccountNumber(String country) {
        String prefix = switch (country.toUpperCase()) {
            case "INDIA" -> "IN";
            case "USA" -> "US"; 
            case "UK" -> "UK";
            default -> "XX";
        };
        
        long randomNum = (long) (Math.random() * 1_000_000_000L);
        return prefix + String.format("%010d", randomNum);
    }
    
    private Map<String, AccountCreationResponse.ValidationResult> buildValidationResults(Set<ConstraintViolation<Object>> violations) {
        Map<String, AccountCreationResponse.ValidationResult> results = new HashMap<>();
        
        Map<String, List<String>> groupedErrors = violations.stream()
            .collect(Collectors.groupingBy(
                v -> getFieldSection(v.getPropertyPath().toString()),
                Collectors.mapping(v -> getUserFriendlyMessage(v), Collectors.toList())
            ));
            
        groupedErrors.forEach((section, errors) -> {
            AccountCreationResponse.ValidationResult result = new AccountCreationResponse.ValidationResult();
            result.setValid(false);
            result.setErrors(errors);
            results.put(section, result);
        });
        
        return results;
    }
    
    private String getUserFriendlyMessage(ConstraintViolation<Object> violation) {
        String fieldName = violation.getPropertyPath().toString();
        String message = violation.getMessage();
        Object invalidValue = violation.getInvalidValue();
        
        // Convert technical field names to user-friendly names
        String friendlyFieldName = switch (fieldName.toLowerCase()) {
            case "pan" -> "PAN Card Number";
            case "aadhaar" -> "Aadhaar Number";
            case "email" -> "Email Address";
            case "mobile", "phone" -> "Phone Number";
            case "fullname" -> "Full Name";
            case "dateofbirth" -> "Date of Birth";
            case "annualincome" -> "Annual Income";
            case "monthlyincome" -> "Monthly Income";
            case "ifsccode" -> "IFSC Code";
            case "userid" -> "User ID";
            case "ssn" -> "SSN";
            case "nin" -> "NIN";
            default -> fieldName;
        };
        
        // Provide specific guidance for common validation errors
        if (message.contains("must match")) {
            if (fieldName.equals("pan")) {
                return friendlyFieldName + " must be in valid format (e.g., ABCDE1234F). You entered: " + invalidValue;
            } else if (fieldName.equals("aadhaar")) {
                return friendlyFieldName + " must be 12 digits. You entered: " + invalidValue;
            } else if (fieldName.equals("email")) {
                return friendlyFieldName + " must be a valid email format. You entered: " + invalidValue;
            } else if (fieldName.contains("mobile") || fieldName.contains("phone")) {
                return friendlyFieldName + " must be in valid format. You entered: " + invalidValue;
            }
        }
        
        if (message.contains("must not be blank") || message.contains("must not be null")) {
            return friendlyFieldName + " is required and cannot be empty.";
        }
        
        if (message.contains("size must be between")) {
            return friendlyFieldName + " length is invalid. " + message;
        }
        
        // Default: return field name + message
        return friendlyFieldName + ": " + message + (invalidValue != null ? " (You entered: " + invalidValue + ")" : "");
    }
    
    private String getFieldSection(String fieldName) {
        if (fieldName.contains("education") || fieldName.contains("institution") || fieldName.contains("course")) {
            return "educational";
        } else if (fieldName.contains("income") || fieldName.contains("employment") || fieldName.contains("occupation")) {
            return "income";
        } else if (fieldName.contains("nominee")) {
            return "nominee";
        } else {
            return "personal";
        }
    }
    
    private String extractUserId(Object dto) {
        try {
            if (dto instanceof IndiaAccountRequest) {
                return ((IndiaAccountRequest) dto).getUserId();
            } else if (dto instanceof UsaAccountRequest) {
                return ((UsaAccountRequest) dto).getUserId();
            } else if (dto instanceof UkAccountRequest) {
                return ((UkAccountRequest) dto).getUserId();
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Unable to extract userId from request");
        }
        return null;
    }
    
    private String extractBank(Object dto) {
        try {
            if (dto instanceof IndiaAccountRequest) {
                return ((IndiaAccountRequest) dto).getBank();
            } else if (dto instanceof UsaAccountRequest) {
                return ((UsaAccountRequest) dto).getBank();
            } else if (dto instanceof UkAccountRequest) {
                return ((UkAccountRequest) dto).getBank();
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Unable to extract bank from request");
        }
        return null;
    }
    
    private String extractBranch(Object dto) {
        try {
            if (dto instanceof IndiaAccountRequest) {
                return ((IndiaAccountRequest) dto).getBranch();
            } else if (dto instanceof UsaAccountRequest) {
                return ((UsaAccountRequest) dto).getBranch();
            } else if (dto instanceof UkAccountRequest) {
                return ((UkAccountRequest) dto).getBranch();
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Unable to extract branch from request");
        }
        return null;
    }
    
    private List<String> getRequiredDocumentTypes() {
        return Arrays.asList("ID Proof", "Address Proof", "Income Proof", "Photo");
    }

    private List<String> validateAccountCreationDocuments(MultipartFile idProof, MultipartFile addressProof,
            MultipartFile incomeProof, MultipartFile photo) {
        List<String> errors = new ArrayList<>();
        validateDocumentForResponse(errors, idProof, DocumentMetadata.DocumentType.ID_PROOF, "ID Proof");
        validateDocumentForResponse(errors, addressProof, DocumentMetadata.DocumentType.ADDRESS_PROOF, "Address Proof");
        validateDocumentForResponse(errors, incomeProof, DocumentMetadata.DocumentType.INCOME_PROOF, "Income Proof");
        validateDocumentForResponse(errors, photo, DocumentMetadata.DocumentType.PHOTO, "Photo");
        return errors;
    }

    private void validateDocumentForResponse(List<String> errors, MultipartFile file,
            DocumentMetadata.DocumentType documentType, String label) {
        try {
            validateDocumentFile(file, documentType);
        } catch (IllegalArgumentException error) {
            errors.add(label + ": " + error.getMessage());
        }
    }

    private void validateDocumentFile(MultipartFile file, DocumentMetadata.DocumentType documentType) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("file is required");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new IllegalArgumentException("filename is required");
        }

        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new IllegalArgumentException("filename cannot contain path characters");
        }

        if (file.getSize() <= 0) {
            throw new IllegalArgumentException("file is empty");
        }

        if (file.getSize() > maxDocumentFileSizeBytes) {
            throw new IllegalArgumentException("file must be " + (maxDocumentFileSizeBytes / (1024 * 1024)) + " MB or smaller");
        }

        if (!isValidDocumentType(file, documentType)) {
            throw new IllegalArgumentException(documentType == DocumentMetadata.DocumentType.PHOTO
                ? "only JPG, JPEG, or PNG files are allowed"
                : "only JPG, JPEG, PNG, or PDF files are allowed");
        }
    }
    
    private boolean isValidDocumentType(MultipartFile file, DocumentMetadata.DocumentType documentType) {
        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        if (contentType == null || originalFilename == null || !originalFilename.contains(".")) return false;
        String extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        
        if (documentType == DocumentMetadata.DocumentType.PHOTO) {
            return (contentType.equals("image/jpeg") || contentType.equals("image/jpg") || contentType.equals("image/png"))
                && Set.of("jpg", "jpeg", "png").contains(extension);
        } else {
            return (contentType.equals("image/jpeg") || contentType.equals("image/jpg") || 
                   contentType.equals("image/png") || contentType.equals("application/pdf"))
                && Set.of("jpg", "jpeg", "png", "pdf").contains(extension);
        }
    }
    
    private String generateUniqueFilename(String originalFilename, Long accountId) {
        String cleanFilename = Paths.get(originalFilename).getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_");
        String extension = cleanFilename.contains(".") ? cleanFilename.substring(cleanFilename.lastIndexOf(".")) : "";
        return accountId + "_" + UUID.randomUUID() + "_" + System.currentTimeMillis() + extension.toLowerCase(Locale.ROOT);
    }
    
    private boolean allRequiredDocumentsUploaded(Long accountId) {
        long uploadedCount = documentRepository.findByAccountId(accountId).size();
        return uploadedCount >= 4; // ID, Address, Income, Photo
    }
    
    // Document retrieval methods
    public List<DocumentMetadata> getAccountDocuments(String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
            .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        return documentRepository.findByAccountId(account.getId());
    }

    public List<DocumentMetadata> getAccountDocumentsById(Long accountId) {
        accountRepository.findById(accountId)
            .orElseThrow(() -> new IllegalArgumentException("Account not found"));
        return documentRepository.findByAccountId(accountId);
    }
    
    public List<DocumentMetadata> getUserDocuments(String userId) {
        List<Account> userAccounts = accountRepository.findByUserId(userId);
        List<DocumentMetadata> allDocuments = new ArrayList<>();
        
        for (Account account : userAccounts) {
            List<DocumentMetadata> accountDocuments = documentRepository.findByAccountId(account.getId());
            allDocuments.addAll(accountDocuments);
        }
        
        return allDocuments;
    }
    
    public DocumentDownloadResponse downloadDocument(Long documentId) {
        DocumentMetadata document = documentRepository.findById(documentId)
            .orElseThrow(() -> new IllegalArgumentException("Document not found"));
            
        try {
            Path filePath = Paths.get(document.getFilePath());
            if (!Files.exists(filePath)) {
                throw new IllegalArgumentException("Document file not found on disk");
            }
            
            Resource resource = new UrlResource(filePath.toUri());
            
            return new DocumentDownloadResponse(
                document.getOriginalFilename(),
                document.getContentType(),
                document.getFileSize(),
                resource
            );
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to download document: " + e.getMessage());
        }
    }
}