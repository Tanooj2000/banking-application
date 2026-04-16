package com.example.account_service.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;

import com.example.account_service.dto.*;
import com.example.account_service.entity.*;
import com.example.account_service.service.AccountService;

import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping({"/api/accounts", "/accounts"})
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:3000"},
    allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
public class AccountController {

    @Autowired
    private AccountService accountService;
    
    // Enhanced account creation endpoints for each country (with required documents)
    @PostMapping(value = "/create/india", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AccountCreationResponse> createIndiaAccount(
            @ModelAttribute IndiaAccountRequest request,
            @RequestParam("idProof") MultipartFile idProof,
            @RequestParam("addressProof") MultipartFile addressProof,
            @RequestParam("incomeProof") MultipartFile incomeProof,
            @RequestParam("photo") MultipartFile photo) {
        try {
            // Validate required documents
            if (idProof.isEmpty() || addressProof.isEmpty() || incomeProof.isEmpty() || photo.isEmpty()) {
                AccountCreationResponse errorResponse = new AccountCreationResponse();
                errorResponse.setMessage("All documents (ID Proof, Address Proof, Income Proof, Photo) are required for account creation");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            AccountCreationResponse response = accountService.createAccount(
                "INDIA", request, idProof, addressProof, incomeProof, photo);
            
            // Success check: applicationId indicates successful creation (pending approval)
            if (response.getApplicationId() != null) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            AccountCreationResponse errorResponse = new AccountCreationResponse();
            errorResponse.setMessage("Account creation failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PostMapping(value = "/create/usa", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AccountCreationResponse> createUsaAccount(
            @ModelAttribute UsaAccountRequest request,
            @RequestParam("idProof") MultipartFile idProof,
            @RequestParam("addressProof") MultipartFile addressProof,
            @RequestParam("incomeProof") MultipartFile incomeProof,
            @RequestParam("photo") MultipartFile photo) {
        try {
            // Validate required documents
            if (idProof.isEmpty() || addressProof.isEmpty() || incomeProof.isEmpty() || photo.isEmpty()) {
                AccountCreationResponse errorResponse = new AccountCreationResponse();
                errorResponse.setMessage("All documents (ID Proof, Address Proof, Income Proof, Photo) are required for account creation");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            AccountCreationResponse response = accountService.createAccount(
                "USA", request, idProof, addressProof, incomeProof, photo);
            
            // Success check: applicationId indicates successful creation (pending approval)
            if (response.getApplicationId() != null) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            AccountCreationResponse errorResponse = new AccountCreationResponse();
            errorResponse.setMessage("Account creation failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PostMapping(value = "/create/uk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AccountCreationResponse> createUkAccount(
            @ModelAttribute UkAccountRequest request,
            @RequestParam("idProof") MultipartFile idProof,
            @RequestParam("addressProof") MultipartFile addressProof,
            @RequestParam("incomeProof") MultipartFile incomeProof,
            @RequestParam("photo") MultipartFile photo) {
        try {
            // Validate required documents
            if (idProof.isEmpty() || addressProof.isEmpty() || incomeProof.isEmpty() || photo.isEmpty()) {
                AccountCreationResponse errorResponse = new AccountCreationResponse();
                errorResponse.setMessage("All documents (ID Proof, Address Proof, Income Proof, Photo) are required for account creation");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            AccountCreationResponse response = accountService.createAccount(
                "UK", request, idProof, addressProof, incomeProof, photo);
            
            // Success check: applicationId indicates successful creation (pending approval)
            if (response.getApplicationId() != null) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            AccountCreationResponse errorResponse = new AccountCreationResponse();
            errorResponse.setMessage("Account creation failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // Documents are now REQUIRED for all account creation - use multipart endpoints above
    @PostMapping("/create/{country}")
    public ResponseEntity<String> createAccount(@PathVariable String country, @RequestBody Map<String, Object> payload) {
        return ResponseEntity.badRequest().body(
            "Documents are required for account creation. Please use multipart endpoints:\n" +
            "- POST /api/accounts/create/india with form-data\n" +
            "- POST /api/accounts/create/usa with form-data\n" +
            "- POST /api/accounts/create/uk with form-data\n" +
            "All endpoints require: idProof, addressProof, incomeProof, photo files"
        );
    }
    
    // Document upload endpoints
    @PostMapping("/{accountNumber}/documents")
    public ResponseEntity<DocumentUploadResponse> uploadDocument(
            @PathVariable String accountNumber,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType) {
        
        try {
            DocumentMetadata.DocumentType type = DocumentMetadata.DocumentType.valueOf(documentType.toUpperCase());
            DocumentUploadResponse response = accountService.uploadDocument(accountNumber, file, type);
            
            if (response.isValid()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            DocumentUploadResponse errorResponse = new DocumentUploadResponse();
            errorResponse.setAccountNumber(accountNumber);
            errorResponse.setMessage("Upload failed: " + e.getMessage());
            errorResponse.setValid(false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // Check application status by application ID
    @GetMapping("/status/{applicationId}")
    public ResponseEntity<AccountCreationResponse> getApplicationStatus(@PathVariable String applicationId) {
        try {
            AccountCreationResponse response = accountService.getApplicationStatus(applicationId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            AccountCreationResponse errorResponse = new AccountCreationResponse();
            errorResponse.setMessage(e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            AccountCreationResponse errorResponse = new AccountCreationResponse();
            errorResponse.setMessage("Failed to get application status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // Enhanced Admin endpoints for application management
    @GetMapping("/admin/pending")
    public ResponseEntity<List<Account>> getPendingApplications() {
        try {
            List<Account> pendingApps = accountService.getPendingApplications();
            return ResponseEntity.ok(pendingApps);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/admin/details/{accountId}")
    public ResponseEntity<AccountCreationResponse> getAccountDetails(@PathVariable Long accountId) {
        try {
            AccountCreationResponse response = accountService.getAccountDetails(accountId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            AccountCreationResponse errorResponse = new AccountCreationResponse();
            errorResponse.setMessage(e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            AccountCreationResponse errorResponse = new AccountCreationResponse();
            errorResponse.setMessage("Failed to get account details: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // Account management endpoints
    @PostMapping("/approve/{accountId}")
    public ResponseEntity<AccountCreationResponse> approveAccount(@PathVariable Long accountId) {
        try {
            accountService.approveAccount(accountId);
            // Get updated account details after approval
            AccountCreationResponse response = accountService.getAccountDetails(accountId);
            response.setMessage("✅ Account approved successfully! Account Number: " + response.getAccountNumber());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            AccountCreationResponse errorResponse = new AccountCreationResponse();
            errorResponse.setMessage(e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            AccountCreationResponse errorResponse = new AccountCreationResponse();
            errorResponse.setMessage("Approval failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/reject/{accountId}")
    public ResponseEntity<String> rejectAccount(@PathVariable Long accountId, 
                                               @RequestParam(required = false) String reason) {
        try {
            accountService.rejectAccount(accountId, reason);
            return ResponseEntity.ok("Account rejected successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Rejection failed: " + e.getMessage());
        }
    }
    
    // Query endpoints
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Account>> getAccountsByUserId(@PathVariable String userId) {
        try {
            List<Account> accounts = accountService.getAccountsByUserId(userId);
            if (accounts.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(accounts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/bank/{bankName}")
    public ResponseEntity<List<Account>> getAccountsByBankName(@PathVariable String bankName) {
        try {
            List<Account> accounts = accountService.getAccountsByBankName(bankName);
            if (accounts.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(accounts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Account>> getAccountsByStatus(@PathVariable String status) {
        try {
            AccountStatus accountStatus = AccountStatus.valueOf(status.toUpperCase());
            List<Account> accounts = accountService.getAccountsByStatus(accountStatus);
            if (accounts.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(accounts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/account/{accountNumber}")
    public ResponseEntity<Account> getAccountByNumber(@PathVariable String accountNumber) {
        try {
            Optional<Account> account = accountService.getAccountByNumber(accountNumber);
            if (account.isPresent()) {
                return ResponseEntity.ok(account.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Utility endpoints
    @GetMapping("/countries/{country}/account-types")
    public ResponseEntity<List<AccountType>> getAccountTypesForCountry(@PathVariable String country) {
        try {
            List<AccountType> accountTypes = AccountType.getValidTypesForCountry(country.toUpperCase())
                .stream().toList();
            return ResponseEntity.ok(accountTypes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Document management endpoints
    @GetMapping("/account/{accountNumber}/documents")
    public ResponseEntity<List<DocumentMetadata>> getAccountDocuments(@PathVariable String accountNumber) {
        try {
            List<DocumentMetadata> documents = accountService.getAccountDocuments(accountNumber);
            return ResponseEntity.ok(documents);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/user/{userId}/documents")
    public ResponseEntity<List<DocumentMetadata>> getUserDocuments(@PathVariable String userId) {
        try {
            List<DocumentMetadata> documents = accountService.getUserDocuments(userId);
            if (documents.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(documents);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/documents/{documentId}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long documentId) {
        try {
            DocumentDownloadResponse response = accountService.downloadDocument(documentId);
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + response.getOriginalFilename() + "\"")
                .contentType(MediaType.parseMediaType(response.getContentType()))
                .body(response.getResource());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/documents/{documentId}/view")
    public ResponseEntity<Resource> viewDocument(@PathVariable Long documentId) {
        try {
            DocumentDownloadResponse response = accountService.downloadDocument(documentId);
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + response.getOriginalFilename() + "\"")
                .contentType(MediaType.parseMediaType(response.getContentType()))
                .body(response.getResource());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Helper method for legacy support
    private Object convertPayloadToRequest(String country, Map<String, Object> payload) {
        // This would need ObjectMapper conversion similar to the old service method
        // For now, return payload as is - the service will handle conversion
        return payload;
    }
}