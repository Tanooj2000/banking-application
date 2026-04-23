package com.bankingapp.chatbot.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
// import com.fasterxml.jackson.databind.JsonNode; // Unused import removed

import java.util.HashMap;
import java.util.Map;
import java.util.List;
// import java.util.ArrayList; // Unused import removed

@Service
public class MicroserviceIntegrationService {

    @Autowired
    private RestTemplate restTemplate;
    
    // private final ObjectMapper objectMapper = new ObjectMapper(); // Unused field removed
    
    // Service URLs - Updated with correct endpoints
    private static final String ACCOUNT_SERVICE_URL = "http://localhost:8085/api/accounts";
    private static final String USER_SERVICE_URL = "http://localhost:8081/api/user";
    private static final String BANK_SERVICE_URL = "http://localhost:8082";
    private static final String ADMIN_SERVICE_URL = "http://localhost:8083";
    
    // Alternative account service URL if needed
    // private static final String ACCOUNT_SERVICE_ALT_URL = "http://localhost:8085/accounts"; // Unused field removed

    /**
     * Create HTTP headers with JWT authentication
     */
    private HttpHeaders createAuthHeaders(String authToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        if (authToken != null && !authToken.trim().isEmpty()) {
            headers.set("Authorization", "Bearer " + authToken);
        }
        return headers;
    }

    /**
     * Get account information for a user - Updated with JWT authentication
     */
    public Map<String, Object> getUserAccounts(String userId, String authToken) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            System.out.println("🚀 DEBUG: getUserAccounts called for userId: " + userId);
            System.out.println("🔑 DEBUG: AuthToken provided: " + (authToken != null && !authToken.trim().isEmpty()));
            System.out.println("📡 DEBUG: Calling URL: " + ACCOUNT_SERVICE_URL + "/user/" + userId);
            
            // Create request with JWT authentication headers
            HttpHeaders headers = createAuthHeaders(authToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Use correct endpoint: GET /user/{userId} with authentication
            ResponseEntity<String> response = restTemplate.exchange(
                ACCOUNT_SERVICE_URL + "/user/" + userId,
                HttpMethod.GET,
                entity,
                String.class
            );
            
            System.out.println("📊 DEBUG: Response status: " + response.getStatusCode());
            System.out.println("📄 DEBUG: Response body: " + response.getBody());
            
            if (response.getStatusCode().is2xxSuccessful()) {
                result.put("success", true);
                result.put("data", response.getBody());
                result.put("message", "Found account information for user " + userId);
                result.put("endpoint", "GET /user/" + userId);
            } else {
                result.put("success", false);
                result.put("message", "No accounts found for user " + userId);
                System.out.println("❌ DEBUG: Non-successful response: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.out.println("⚠️ EXCEPTION in getUserAccounts: " + e.getClass().getName() + " - " + e.getMessage());
            e.printStackTrace();
            
            result.put("success", false);
            result.put("message", "Account service temporarily unavailable. Please try again later or contact support.");
            result.put("error", "SERVICE_UNAVAILABLE");
            result.put("details", e.getMessage());
        }
        
        return result;
    }

    /**
     * Check application status - Updated with JWT authentication
     */
    public Map<String, Object> getApplicationStatus(String applicationId, String authToken) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Create request with JWT authentication headers
            HttpHeaders headers = createAuthHeaders(authToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Use correct endpoint: GET /status/{applicationId} with authentication
            ResponseEntity<String> response = restTemplate.exchange(
                ACCOUNT_SERVICE_URL + "/status/" + applicationId,
                HttpMethod.GET,
                entity,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                result.put("success", true);
                result.put("data", response.getBody());
                result.put("message", "Application status retrieved for ID: " + applicationId);
                result.put("endpoint", "GET /status/" + applicationId);
            } else {
                result.put("success", false);
                result.put("message", "Application not found for ID: " + applicationId);
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Unable to check application status. Please verify your application ID or try again later.");
            result.put("error", "SERVICE_UNAVAILABLE");
            result.put("details", e.getMessage());
        }
        
        return result;
    }

    /**
     * Get account by account number - Updated with JWT authentication
     */
    public Map<String, Object> getAccountByNumber(String accountNumber, String authToken) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Create request with JWT authentication headers
            HttpHeaders headers = createAuthHeaders(authToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Use correct endpoint: GET /account/{accountNumber} with authentication
            ResponseEntity<String> response = restTemplate.exchange(
                ACCOUNT_SERVICE_URL + "/account/" + accountNumber,
                HttpMethod.GET,
                entity,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                result.put("success", true);
                result.put("data", response.getBody());
                result.put("message", "Account found: " + accountNumber);
                result.put("endpoint", "GET /account/" + accountNumber);
            } else {
                result.put("success", false);
                result.put("message", "Account not found: " + accountNumber);
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Unable to retrieve account information. Please check the account number.");
            result.put("error", "SERVICE_UNAVAILABLE");
            result.put("details", e.getMessage());
        }
        
        return result;
    }

    /**
     * Get bank branches by country - Updated with JWT authentication
     */
    public Map<String, Object> getBanksByCountry(String country, String authToken) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Create request with JWT authentication headers
            HttpHeaders headers = createAuthHeaders(authToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Use correct Bank Service API: GET /api/banks/country/{country} with authentication
            ResponseEntity<String> response = restTemplate.exchange(
                BANK_SERVICE_URL + "/api/banks/country/" + country,
                HttpMethod.GET,
                entity,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                result.put("success", true);
                result.put("data", response.getBody());
                result.put("message", "Found banks in " + country);
                result.put("endpoint", "GET /api/banks/country/" + country);
            } else {
                result.put("success", false);
                result.put("message", "No banks found in " + country);
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Bank service temporarily unavailable. Please contact customer service for branch information.");
            result.put("error", "BANK_SERVICE_UNAVAILABLE");
            result.put("alternatives", List.of(
                "Call customer service: 1-800-BANKING",
                "Visit our website branch locator",
                "Use mobile app location services"
            ));
        }
        
        return result;
    }

    /**
     * Get banks by country and city - Updated with JWT authentication
     */
    public Map<String, Object> getBanksByCountryAndCity(String country, String city, String authToken) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Create request with JWT authentication headers
            HttpHeaders headers = createAuthHeaders(authToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Use correct Bank Service API: GET /api/banks/country/{country}/city/{city} with authentication
            ResponseEntity<String> response = restTemplate.exchange(
                BANK_SERVICE_URL + "/api/banks/country/" + country + "/city/" + city,
                HttpMethod.GET,
                entity,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                result.put("success", true);
                result.put("data", response.getBody());
                result.put("message", "Found banks in " + city + ", " + country);
                result.put("endpoint", "GET /api/banks/country/" + country + "/city/" + city);
            } else {
                result.put("success", false);
                result.put("message", "No banks found in " + city + ", " + country);
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Bank service temporarily unavailable. Please contact customer service for specific city information.");
            result.put("error", "BANK_SERVICE_UNAVAILABLE");
        }
        
        return result;
    }

    /**
     * Check if bank code is available - New Bank Service feature
     */
    public Map<String, Object> checkBankCodeAvailability(String bankCode) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Use Bank Service API: GET /api/banks/check-code/{code}
            ResponseEntity<String> response = restTemplate.getForEntity(
                BANK_SERVICE_URL + "/api/banks/check-code/" + bankCode,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                result.put("success", true);
                result.put("data", response.getBody());
                result.put("message", "Bank code " + bankCode + " availability checked");
            } else {
                result.put("success", false);
                result.put("message", "Unable to check bank code " + bankCode);
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Bank code verification service temporarily unavailable.");
            result.put("error", "BANK_SERVICE_UNAVAILABLE");
        }
        
        return result;
    }

    /**
     * Check if branch exists - New Bank Service feature
     */
    public Map<String, Object> checkBranchExists(String country, String city, String bankName, String branch) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Use Bank Service API: GET /api/banks/check-branch?country={country}&city={city}&bankName={bankName}&branch={branch}
            String url = BANK_SERVICE_URL + "/api/banks/check-branch?country=" + country + 
                        "&city=" + city + "&bankName=" + bankName + "&branch=" + branch;
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                result.put("success", true);
                result.put("data", response.getBody());
                result.put("message", "Branch verification completed for " + bankName + " in " + city);
            } else {
                result.put("success", false);
                result.put("message", "Branch not found: " + branch + " of " + bankName + " in " + city + ", " + country);
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Branch verification service temporarily unavailable.");
            result.put("error", "BANK_SERVICE_UNAVAILABLE");
        }
        
        return result;
    }

    /**
     * Get all banks - Updated with JWT authentication
     */
    public Map<String, Object> getAllBanks(String authToken) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Create request with JWT authentication headers
            HttpHeaders headers = createAuthHeaders(authToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Use Bank Service API: GET /api/banks/all with authentication
            ResponseEntity<String> response = restTemplate.exchange(
                BANK_SERVICE_URL + "/api/banks/all",
                HttpMethod.GET,
                entity,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                result.put("success", true);
                result.put("data", response.getBody());
                result.put("message", "Retrieved all available banks");
            } else {
                result.put("success", false);
                result.put("message", "No banks available in the system");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Bank directory service temporarily unavailable.");
            result.put("error", "BANK_SERVICE_UNAVAILABLE");
        }
        
        return result;
    }

    /**
     * Get user profile information - Updated with JWT authentication
     */
    public Map<String, Object> getUserProfile(String userId, String authToken) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Create request with JWT authentication headers
            HttpHeaders headers = createAuthHeaders(authToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Use correct user service endpoint: GET /api/user/{id} with authentication
            ResponseEntity<String> response = restTemplate.exchange(
                USER_SERVICE_URL + "/" + userId,
                HttpMethod.GET,
                entity,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                result.put("success", true);
                result.put("data", response.getBody());
                result.put("message", "Found user profile for ID: " + userId);
            } else {
                result.put("success", false);
                result.put("message", "User profile not found for ID: " + userId);
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "User service temporarily unavailable. Please try again later or contact support.");
            result.put("error", "SERVICE_UNAVAILABLE");
            result.put("alternatives", List.of(
                "Log into the main banking application",
                "Call customer service: 1-800-BANKING",
                "Visit any branch location"
            ));
        }
        
        return result;
    }

    /**
     * Check user authentication status - Updated with JWT authentication
     */
    public Map<String, Object> getUserMe(String authToken) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Create request with JWT authentication headers
            HttpHeaders headers = createAuthHeaders(authToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Use GET /api/user/me endpoint with authentication to get current user info
            ResponseEntity<String> response = restTemplate.exchange(
                USER_SERVICE_URL + "/me",
                HttpMethod.GET,
                entity,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                result.put("success", true);
                result.put("data", response.getBody());
                result.put("message", "Current user information retrieved successfully");
            } else {
                result.put("success", false);
                result.put("message", "Unable to retrieve current user information. Please ensure you're logged in.");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Authentication service temporarily unavailable. Please log in through the main application.");
            result.put("error", "AUTH_SERVICE_UNAVAILABLE");
            result.put("alternatives", List.of(
                "Log in through the main banking application",
                "Contact customer service if login issues persist"
            ));
        }
        
        return result;
    }

    /**
     * Update user email - NEW
     */
    public Map<String, Object> updateUserEmail(String userId, String newEmail, String authToken) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            System.out.println("📧 DEBUG: updateUserEmail called for userId: " + userId + ", newEmail: " + newEmail);
            
            // Create request body
            Map<String, Object> updateRequest = new HashMap<>();
            updateRequest.put("email", newEmail);
            
            // Create request with JWT authentication headers
            HttpHeaders headers = createAuthHeaders(authToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(updateRequest, headers);
            
            // Call PUT /api/user/{id}
            ResponseEntity<String> response = restTemplate.exchange(
                USER_SERVICE_URL + "/" + userId,
                HttpMethod.PUT,
                entity,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                result.put("success", true);
                result.put("message", "Email updated successfully to: " + newEmail);
                result.put("data", response.getBody());
            } else {
                result.put("success", false);
                result.put("message", "Failed to update email. Please try again.");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Email update service temporarily unavailable. Please try through the main app.");
            result.put("error", "UPDATE_SERVICE_UNAVAILABLE");
        }
        
        return result;
    }

    /**
     * Update user phone - NEW
     */
    public Map<String, Object> updateUserPhone(String userId, String newPhone, String authToken) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            System.out.println("📱 DEBUG: updateUserPhone called for userId: " + userId + ", newPhone: " + newPhone);
            
            // Create request body
            Map<String, Object> updateRequest = new HashMap<>();
            updateRequest.put("phonenumber", Long.parseLong(newPhone));
            
            // Create request with JWT authentication headers
            HttpHeaders headers = createAuthHeaders(authToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(updateRequest, headers);
            
            // Call PUT /api/user/{id}
            ResponseEntity<String> response = restTemplate.exchange(
                USER_SERVICE_URL + "/" + userId,
                HttpMethod.PUT,
                entity,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                result.put("success", true);
                result.put("message", "Phone number updated successfully to: " + newPhone);
                result.put("data", response.getBody());
            } else {
                result.put("success", false);
                result.put("message", "Failed to update phone number. Please try again.");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Phone update service temporarily unavailable. Please try through the main app.");
            result.put("error", "UPDATE_SERVICE_UNAVAILABLE");
        }
        
        return result;
    }

    /**
     * Update user password - NEW
     */
    public Map<String, Object> updateUserPassword(String userId, String currentPassword, String newPassword, String authToken) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            System.out.println("🔒 DEBUG: updateUserPassword called for userId: " + userId);
            
            // Create request body for password change
            Map<String, Object> passwordRequest = new HashMap<>();
            passwordRequest.put("currentPassword", currentPassword);
            passwordRequest.put("newPassword", newPassword);
            
            // Create request with JWT authentication headers
            HttpHeaders headers = createAuthHeaders(authToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(passwordRequest, headers);
            
            // Call PUT /api/user/{id}/password
            ResponseEntity<String> response = restTemplate.exchange(
                USER_SERVICE_URL + "/" + userId + "/password",
                HttpMethod.PUT,
                entity,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                result.put("success", true);
                result.put("message", "Password updated successfully.");
                result.put("data", response.getBody());
            } else {
                result.put("success", false);
                result.put("message", "Failed to update password. Please check your current password.");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Password update service temporarily unavailable. Please try through the main app.");
            result.put("error", "UPDATE_SERVICE_UNAVAILABLE");
        }
        
        return result;
    }

    /**
     * Check service health for all microservices - Updated with correct account service
     */
    public Map<String, Object> checkServicesHealth() {
        Map<String, Object> result = new HashMap<>();
        Map<String, String> serviceStatus = new HashMap<>();
        
        // Check account service (known working endpoint)
        serviceStatus.put("account-service", checkAccountServiceHealth());
        
        // Check user service (updated with correct endpoint)
        serviceStatus.put("user-service", checkUserServiceHealth());
        
        // Check admin service (updated with correct endpoint)
        serviceStatus.put("admin-service", checkAdminServiceHealth());
        
        // Check bank service (updated with correct endpoint)
        serviceStatus.put("bank-service", checkBankServiceHealth());
        
        result.put("services", serviceStatus);
        
        // Account and User services are the primary ones needed
        boolean accountServiceUp = "UP".equals(serviceStatus.get("account-service"));
        boolean userServiceUp = "UP".equals(serviceStatus.get("user-service"));
        boolean adminServiceUp = "UP".equals(serviceStatus.get("admin-service"));
        
        result.put("primaryServiceUp", accountServiceUp);
        result.put("criticalServicesUp", accountServiceUp && userServiceUp);
        
        boolean bankServiceUp = "UP".equals(serviceStatus.get("bank-service"));
        result.put("allConfiguredServicesUp", accountServiceUp && userServiceUp && adminServiceUp && bankServiceUp);
        result.put("message", 
            accountServiceUp && userServiceUp && adminServiceUp && bankServiceUp ? 
                "All microservices operational and fully integrated!" :
            accountServiceUp && userServiceUp && adminServiceUp ? 
                "Core services operational. Bank service pending." :
            accountServiceUp && userServiceUp ? 
                "Core services operational. Admin/Bank services pending." :
            accountServiceUp ? 
                "Account service operational. Other services pending." : 
                "Core services down. Please check configuration.");
        
        return result;
    }
    
    private String checkAccountServiceHealth() {
        try {
            // Try a simple endpoint to check if account service is responding
            ResponseEntity<String> response = restTemplate.getForEntity(
                ACCOUNT_SERVICE_URL + "/user/health-check", 
                String.class
            );
            return response.getStatusCode().is2xxSuccessful() ? "UP" : "DOWN";
        } catch (Exception e) {
            // Try alternative health endpoint
            try {
                ResponseEntity<String> response = restTemplate.getForEntity(
                    "http://localhost:8085/actuator/health", 
                    String.class
                );
                return response.getStatusCode().is2xxSuccessful() ? "UP" : "DOWN";
            } catch (Exception ex) {
                return "DOWN";
            }
        }
    }

    /**
     * Check user service health
     */
    private String checkUserServiceHealth() {
        try {
            // Try user service health check endpoint
            ResponseEntity<String> response = restTemplate.getForEntity(
                USER_SERVICE_URL, 
                String.class
            );
            return response.getStatusCode().is2xxSuccessful() ? "UP" : "DOWN";
        } catch (Exception e) {
            // Try alternative health endpoint if it exists
            try {
                ResponseEntity<String> response = restTemplate.getForEntity(
                    "http://localhost:8081/actuator/health", 
                    String.class
                );
                return response.getStatusCode().is2xxSuccessful() ? "UP" : "DOWN";
            } catch (Exception ex) {
                return "DOWN";
            }
        }
    }

    private String checkServiceHealth(String healthUrl) {
        // Legacy method - replaced with specific service health checks
        return "DEPRECATED";
    }

    /**
     * Check admin service health
     */
    private String checkAdminServiceHealth() {
        try {
            // Try admin service health check endpoint
            ResponseEntity<String> response = restTemplate.getForEntity(
                ADMIN_SERVICE_URL + "/api/admin/application-status", 
                String.class
            );
            return response.getStatusCode().is2xxSuccessful() ? "UP" : "DOWN";
        } catch (Exception e) {
            // Try alternative health endpoint if it exists
            try {
                ResponseEntity<String> response = restTemplate.getForEntity(
                    "http://localhost:8083/actuator/health", 
                    String.class
                );
                return response.getStatusCode().is2xxSuccessful() ? "UP" : "DOWN";
            } catch (Exception ex) {
                return "DOWN";
            }
        }
    }

    /**
     * Get admin application status information - Updated with JWT authentication
     */
    public Map<String, Object> getAdminApplicationStatus(String authToken) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Create request with JWT authentication headers
            HttpHeaders headers = createAuthHeaders(authToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Use GET /api/admin/application-status endpoint with authentication
            ResponseEntity<String> response = restTemplate.exchange(
                ADMIN_SERVICE_URL + "/api/admin/application-status",
                HttpMethod.GET,
                entity,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                result.put("success", true);
                result.put("data", response.getBody());
                result.put("message", "Application status information retrieved successfully");
            } else {
                result.put("success", false);
                result.put("message", "No application status information available");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Admin application status service temporarily unavailable. Please contact customer service.");
            result.put("error", "ADMIN_SERVICE_UNAVAILABLE");
            result.put("alternatives", List.of(
                "Call customer service: 1-800-BANKING",
                "Visit any branch location",
                "Email admin support"
            ));
        }
        
        return result;
    }

    /**
     * Get admin contact information by bank - Updated with JWT authentication
     */
    public Map<String, Object> getAdminEmailsByBank(String authToken) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Create request with JWT authentication headers
            HttpHeaders headers = createAuthHeaders(authToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Use GET /api/admin/emails/by-bank endpoint with authentication
            ResponseEntity<String> response = restTemplate.exchange(
                ADMIN_SERVICE_URL + "/api/admin/emails/by-bank",
                HttpMethod.GET,
                entity,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                result.put("success", true);
                result.put("data", response.getBody());
                result.put("message", "Admin contact information by bank retrieved successfully");
            } else {
                result.put("success", false);
                result.put("message", "Admin contact information not available");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Admin contact service temporarily unavailable. Please use general customer service.");
            result.put("error", "ADMIN_CONTACT_UNAVAILABLE");
            result.put("alternatives", List.of(
                "General customer service: 1-800-BANKING",
                "Visit any branch location",
                "Website contact form"
            ));
        }
        
        return result;
    }

    /**
     * Check bank service health
     */
    private String checkBankServiceHealth() {
        try {
            // Try bank service health check endpoint using GET /api/banks/all
            ResponseEntity<String> response = restTemplate.getForEntity(
                BANK_SERVICE_URL + "/api/banks/all", 
                String.class
            );
            return response.getStatusCode().is2xxSuccessful() ? "UP" : "DOWN";
        } catch (Exception e) {
            // Try alternative health endpoint if it exists
            try {
                ResponseEntity<String> response = restTemplate.getForEntity(
                    "http://localhost:8082/actuator/health", 
                    String.class
                );
                return response.getStatusCode().is2xxSuccessful() ? "UP" : "DOWN";
            } catch (Exception ex) {
                return "DOWN";
            }
        }
    }

    /**
     * Format response data for chatbot display - Enhanced formatting
     */
    public String formatResponseForChat(Map<String, Object> serviceResponse, String context) {
        if (!(Boolean) serviceResponse.getOrDefault("success", false)) {
            String errorMsg = (String) serviceResponse.getOrDefault("message", "Service unavailable");
            return "❌ " + errorMsg;
        }

        String message = "✅ " + serviceResponse.getOrDefault("message", "Request successful");
        
        // Add context-specific formatting
        switch (context) {
            case "accounts":
                message += "\n\n📊 **Next Steps:**\n";
                message += "• For detailed balance: Log into your account\n";
                message += "• For transactions: Visit online banking\n";
                message += "• For support: Contact customer service";
                break;
            case "banks":
            case "branches":
                message += "\n\n🗺️ **Branch Services:**\n";
                message += "• Account opening and services\n";
                message += "• Customer support and consultations\n";
                message += "• Document verification\n";
                if (serviceResponse.containsKey("note")) {
                    message += "\nℹ️ " + serviceResponse.get("note");
                }
                break;
            case "profile":
                message += "\n\n👤 **Profile Management:**\n";
                message += "• Update personal information\n";
                message += "• Change contact details\n";
                message += "• Security settings\n";
                @SuppressWarnings("unchecked")
                List<String> alternatives = (List<String>) serviceResponse.get("alternatives");
                if (alternatives != null) {
                    message += "\n🔄 **Alternatives:**\n";
                    for (String alt : alternatives) {
                        message += "• " + alt + "\n";
                    }
                }
                break;
            case "application":
                message += "\n\n📄 **Application Tracking:**\n";
                message += "• Status updates via SMS/Email\n";
                message += "• Document upload requirements\n";
                message += "• Estimated processing time";
                break;
            case "admin":
                message += "\n\n📧 **Admin Support Services:**\n";
                message += "• Regional contact information\n";
                message += "• Specialized support channels\n";
                message += "• Administrative assistance\n";
                @SuppressWarnings("unchecked")
                List<String> adminAlternatives = (List<String>) serviceResponse.get("alternatives");
                if (adminAlternatives != null) {
                    message += "\n🔄 **Additional Options:**\n";
                    for (String alt : adminAlternatives) {
                        message += "• " + alt + "\n";
                    }
                }
                break;
            case "bank":
                message += "\n\n🏛️ **Bank Information Services:**\n";
                message += "• Branch locations and contact details\n";
                message += "• Bank codes and verification\n";
                message += "• Regional banking services\n";
                String endpoint = (String) serviceResponse.get("endpoint");
                if (endpoint != null) {
                    message += "• Data source: " + endpoint + "\n";
                }
                @SuppressWarnings("unchecked")
                List<String> bankAlternatives = (List<String>) serviceResponse.get("alternatives");
                if (bankAlternatives != null) {
                    message += "\n🔄 **Alternative Options:**\n";
                    for (String alt : bankAlternatives) {
                        message += "• " + alt + "\n";
                    }
                }
                break;
            default:
                message += "\n\n📞 For detailed assistance, contact customer service or visit our website.";
        }
        
        return message;
    }
}