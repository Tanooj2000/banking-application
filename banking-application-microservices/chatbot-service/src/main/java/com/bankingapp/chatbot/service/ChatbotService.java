package com.bankingapp.chatbot.service;

import com.bankingapp.chatbot.dto.ChatRequestDTO;
import com.bankingapp.chatbot.dto.ChatResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatbotService {

    // Conversation state enum
    public enum ConversationState {
        NORMAL,
        WAITING_FOR_OLD_PASSWORD,
        WAITING_FOR_NEW_PASSWORD
    }

    private static final Map<Pattern, String> BANKING_RESPONSES = new HashMap<>();
    private static final Map<String, List<String>> QUICK_REPLIES = new HashMap<>();
    
    // Session state management
    private final Map<String, ConversationState> sessionStates = new ConcurrentHashMap<>();
    private final Map<String, String> sessionData = new ConcurrentHashMap<>();
    
    @Autowired
    private MicroserviceIntegrationService integrationService;
    
    static {
        initializeBankingResponses();
        initializeQuickReplies();
    }

    private static void initializeBankingResponses() {
        // ACTUAL IMPLEMENTED FEATURES - Based on real microservices
        
        // Account Creation & Management (REAL)
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(create account|open account|new account|account opening)\\b.*", Pattern.CASE_INSENSITIVE),
                "I can help you create a new bank account! We support accounts for India, USA, and UK. You'll need to upload ID proof, address proof, income proof, and a photo. Would you like to start the application process?");
        
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(application status|account status|approval status|application)\\b.*", Pattern.CASE_INSENSITIVE),
                "I can check your account application status. Please provide your application ID or account number, and I'll look up the current status for you.");
        
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(view details|account details|detailed view|more details|full details)\\b.*", Pattern.CASE_INSENSITIVE),
                "I can show you detailed account information including complete account summary, transaction capabilities, and account settings. Let me fetch your comprehensive account details.");
        
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(documents|upload|document|required papers|paperwork)\\b.*", Pattern.CASE_INSENSITIVE),
                "For account creation, you need to upload: ID Proof, Address Proof, Income Proof, and a Photo. I can guide you through the document upload process. Which document would you like help with?");
        
        // Bank Information (REAL)
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(branch|branches|location|bank location|nearest branch)\\b.*", Pattern.CASE_INSENSITIVE),
                "I can help you find bank branches in your area. Which country and city are you looking for? We have branches in India, USA, and UK.");
        
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(bank codes|bank code|branch code|swift code)\\b.*", Pattern.CASE_INSENSITIVE),
                "I can help you find bank codes and branch information. Please tell me which bank and location you're looking for, and I'll provide the details.");
        
        // User Account Management (REAL)
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(profile|update profile|user details|my info|account info)\\b.*", Pattern.CASE_INSENSITIVE),
                "I can help you update your profile information like email, phone number, or username. What would you like to update?");
        
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(update email|change email)\\b.*", Pattern.CASE_INSENSITIVE),
                "To update your email: Go to Profile > Edit Profile > Enter new email and verify. You'll receive a confirmation link.");
        
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(update phone|change phone)\\b.*", Pattern.CASE_INSENSITIVE),
                "To update your phone: Go to Profile > Edit Profile > Enter new phone and verify with OTP. Keep your phone accessible.");
        
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(password|change password|reset password|forgot password)\\b.*", Pattern.CASE_INSENSITIVE),
                "To change password: Go to Security settings > Enter current password > Create new password. Need 8+ chars with letters, numbers, symbols.");
        
        // Admin Support (REAL)
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(admin|approval|pending accounts|account approval)\\b.*", Pattern.CASE_INSENSITIVE),
                "If you're an admin, I can help you with account approvals and pending applications. Please log in to your admin account to access these features.");
        
        // NOT IMPLEMENTED FEATURES - Clear messaging
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(balance|account balance|check balance|money|funds)\\b.*", Pattern.CASE_INSENSITIVE),
                "Account balance checking is not available yet. Currently, you can create accounts, check application status, and manage your profile. Our development team is working on adding balance inquiry features.");
        
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(transfer|send money|transfer money|transfer funds|payment)\\b.*", Pattern.CASE_INSENSITIVE),
                "Money transfer functionality is not available yet. Currently available services include account creation, application status checking, and profile management. Stay tuned for transfer features!");
        
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(loan|apply loan|personal loan|home loan|credit)\\b.*", Pattern.CASE_INSENSITIVE),
                "Loan services are not available yet. Currently, you can create bank accounts, check application status, and manage your profile. Our team is working on adding loan features.");
        
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(card|credit card|debit card|apply card)\\b.*", Pattern.CASE_INSENSITIVE),
                "Card services are not available yet. Currently available: account creation, application tracking, and profile management. Card services are planned for future releases.");
        
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(statement|account statement|transaction history|transactions)\\b.*", Pattern.CASE_INSENSITIVE),
                "Account statements and transaction history are not available yet. Current services include account creation and application status checking. Statements will be available once full banking operations are implemented.");
        
        // Customer service
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(customer service|support|help|contact|assistance)\\b.*", Pattern.CASE_INSENSITIVE),
                "I'm here to help you with account creation, application status, profile updates, and finding bank branch information. What specific assistance do you need today?");
        
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(complaint|issue|problem|dispute|error)\\b.*", Pattern.CASE_INSENSITIVE),
                "I'm sorry to hear about your concern. I can help with account creation issues, application problems, or profile update difficulties. Please describe your specific issue and I'll do my best to assist.");
        
        // General greetings
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(hello|hi|hey|good morning|good afternoon|good evening)\\b.*", Pattern.CASE_INSENSITIVE),
                "Hello! Welcome to our Banking Assistant. I can help you with: account creation, checking application status, updating your profile, and finding branch locations. How can I assist you today?");
        
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(thank you|thanks|thank you so much)\\b.*", Pattern.CASE_INSENSITIVE),
                "You're welcome! I'm here to help with account services, application status, and profile management. Is there anything else I can assist you with?");
        
        BANKING_RESPONSES.put(Pattern.compile(".*\\b(bye|goodbye|see you|good night)\\b.*", Pattern.CASE_INSENSITIVE),
                "Thank you for using our Banking Assistant! Feel free to return if you need help with account creation, application status, or profile management. Have a great day!");
    }

    private static void initializeQuickReplies() {
        QUICK_REPLIES.put("greeting", Arrays.asList("Create Account", "Check Application Status", "Find Branch", "Update Profile"));
        QUICK_REPLIES.put("account", Arrays.asList("Account Status", "Upload Documents", "Find Branch", "Contact Support"));
        QUICK_REPLIES.put("status", Arrays.asList("Upload Documents", "Create New Account", "Contact Admin", "Branch Info"));
        QUICK_REPLIES.put("branch", Arrays.asList("Bank Codes", "Account Creation", "Contact Info", "Other Branches"));
        QUICK_REPLIES.put("profile", Arrays.asList("Change Password", "Update Email", "Update Phone", "Account Status"));
        QUICK_REPLIES.put("not_available", Arrays.asList("Create Account", "Check Status", "Find Branch", "Update Profile"));
        QUICK_REPLIES.put("default", Arrays.asList("Account Services", "Application Status", "Branch Information", "Profile Management"));
    }

    public ChatResponseDTO processMessage(ChatRequestDTO request) {
        try {
            System.out.println("ChatbotService processing: " + request.getMessage());
            
            String sessionId = request.getSessionId() != null ? request.getSessionId() : generateSessionId();
            String userMessage = request.getMessage().toLowerCase().trim();
            
            // Check if message needs real API integration (with fallback handling)
            ChatResponseDTO apiResponse = processApiIntegratedMessage(request, sessionId, userMessage);
            if (apiResponse != null) {
                System.out.println("API integration response provided for: " + request.getMessage());
                return apiResponse;
            }
            
            // Find matching response from patterns
            String response = findBestResponse(userMessage);
            
            ChatResponseDTO chatResponse = ChatResponseDTO.success(response, sessionId);
            chatResponse.setMessageId(generateMessageId());
            
            // Add appropriate quick replies
            List<String> quickReplies = getQuickRepliesForMessage(userMessage);
            chatResponse.setQuickReplies(quickReplies);
            
            System.out.println("Pattern matching response provided for: " + request.getMessage());
            return chatResponse;
            
        } catch (Exception e) {
            System.err.println("Error in ChatbotService.processMessage: " + e.getMessage());
            e.printStackTrace();
            
            // Fallback response that always works
            String sessionId = request.getSessionId() != null ? request.getSessionId() : generateSessionId();
            ChatResponseDTO fallbackResponse = ChatResponseDTO.success(
                "I can help you with account creation, checking status, finding branches, and profile updates. What would you like to do?",
                sessionId
            );
            fallbackResponse.setQuickReplies(Arrays.asList("Create Account", "Check Status", "Find Branch", "Get Help"));
            fallbackResponse.setMessageId(generateMessageId());
            
            return fallbackResponse;
        }
    }

    /**
     * Process messages that require integration with actual microservices
     */
    private ChatResponseDTO processApiIntegratedMessage(ChatRequestDTO request, String sessionId, String userMessage) {
        // Extract JWT token from request for authenticated API calls
        String authToken = request.getAuthToken();
        
        System.out.println("🔑 DEBUG: Raw authToken from request: '" + authToken + "'");
        System.out.println("🔑 DEBUG: AuthToken null? " + (authToken == null));
        System.out.println("🔑 DEBUG: AuthToken empty? " + (authToken != null ? authToken.trim().isEmpty() : "N/A"));
        System.out.println("DEBUG: Full request - userId: " + request.getUserId() + ", message: '" + request.getMessage() + "'");
        System.out.println("📝 DEBUG: Processed userMessage: '" + userMessage + "'");
        
        // Check for conversation state management - Handle multi-step flows
        ConversationState currentState = sessionStates.getOrDefault(sessionId, ConversationState.NORMAL);
        System.out.println("🔄 DEBUG: Current conversation state for session " + sessionId + ": " + currentState);
        
        // Handle password change state flow
        if (currentState == ConversationState.WAITING_FOR_OLD_PASSWORD) {
            // User provided old password, store it and ask for new password
            if (userMessage.trim().length() > 0 && !userMessage.contains("cancel")) {
                sessionData.put(sessionId + "_oldPassword", request.getMessage().trim());
                sessionStates.put(sessionId, ConversationState.WAITING_FOR_NEW_PASSWORD);
                
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Old password received.\n\nNow please enter your new password:",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Cancel Update", "Back to Profile"));
                return response;
            } else if (userMessage.contains("cancel")) {
                // Reset state and cancel operation
                sessionStates.remove(sessionId);
                sessionData.remove(sessionId + "_oldPassword");
                
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Password change cancelled.\n\nHow else can I help you?",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Update Email", "Update Phone", "Account Status", "Profile"));
                return response;
            }
        } else if (currentState == ConversationState.WAITING_FOR_NEW_PASSWORD) {
            // User provided new password, process the password change
            if (userMessage.trim().length() > 0 && !userMessage.contains("cancel")) {
                String oldPassword = sessionData.get(sessionId + "_oldPassword");
                String newPassword = request.getMessage().trim();
                
                // Clear session state
                sessionStates.remove(sessionId);
                sessionData.remove(sessionId + "_oldPassword");
                
                if (oldPassword != null && request.getUserId() != null) {
                    System.out.println("✅ DEBUG: Processing password update with old: " + oldPassword + " new: " + newPassword);
                    return processPasswordUpdate(request.getUserId(), oldPassword, newPassword, authToken, sessionId);
                }
            } else if (userMessage.contains("cancel")) {
                // Reset state and cancel operation
                sessionStates.remove(sessionId);
                sessionData.remove(sessionId + "_oldPassword");
                
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Password change cancelled.\n\nHow else can I help you?",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Update Email", "Update Phone", "Account Status", "Profile"));
                return response;
            }
        }
        
        // Enhanced pattern matching for view details (handling emojis and case variations)
        String originalMessage = request.getMessage().toLowerCase();
        boolean isViewDetailsRequest = userMessage.contains("view details") || 
                                     originalMessage.contains("view details") || 
                                     originalMessage.contains("view details") || 
                                     originalMessage.contains("account details") ||
                                     originalMessage.contains("detailed view") ||
                                     originalMessage.contains("more details") ||
                                     originalMessage.contains("full details");
        System.out.println("DEBUG: Is view details request? " + isViewDetailsRequest);
        
        try {
            // Account Creation Process - Enhanced with fallback
            if (userMessage.contains("create account") || userMessage.contains("open account") || userMessage.contains("new account") || userMessage.contains("want create") || userMessage.contains("i want")) {
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Welcome to Account Creation! Choose your country: India (SAVINGS, CURRENT), USA (SAVINGS, CHECKING, BUSINESS), or UK (SAVINGS, CURRENT, BUSINESS). Required documents: ID Proof, Address Proof, Income Proof, and Photo.",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("India Account", "USA Account", "UK Account", "Requirements"));
                return response;
            }
            
            // Check Application Status - Enhanced with automatic user lookup
            if (userMessage.contains("application status") || userMessage.contains("account status") || userMessage.contains("status") || userMessage.contains("check status")) {
                try {
                    // If user is logged in, automatically check their accounts
                    if (request.getUserId() != null && !request.getUserId().equals("anonymous")) {
                        return checkUserAccountStatusWithUserId(request.getUserId(), authToken, sessionId);
                    } else {
                        // User not logged in - ask for identification
                        ChatResponseDTO response = ChatResponseDTO.success(
                            "To check your account status, please login to your account first or provide your User ID. Once logged in, I can show all your account information.",
                            sessionId
                        );
                        response.setQuickReplies(Arrays.asList("Login Required", "Contact Support", "Back to Main", "Create Account"));
                        return response;
                    }
                } catch (Exception e) {
                    // Enhanced fallback with error details for debugging
                    System.out.println("Exception in checkUserAccountStatusWithUserId: " + e.getMessage());
                    e.printStackTrace();
                    
                    // Return proper fallback response instead of falling through
                    ChatResponseDTO response = ChatResponseDTO.success(
                        "I'm having trouble accessing your account information right now. I can help with creating accounts, finding branches, or contact support instead. For detailed account information, please use the main banking application.",
                        sessionId
                    );
                    response.setQuickReplies(Arrays.asList("Create Account", "Find Branch", "Contact Support", "Main App"));
                    return response;
                }
            }
            
            // View Account Details - Enhanced detailed view for logged-in users  
            if (isViewDetailsRequest) {
                try {
                    // If user is logged in, show detailed account information
                    if (request.getUserId() != null && !request.getUserId().equals("anonymous")) {
                        return getDetailedAccountViewWithUserId(request.getUserId(), authToken, sessionId);
                    } else {
                        // User not logged in - ask for identification
                        ChatResponseDTO response = ChatResponseDTO.success(
                            "Please login to your account first to view detailed account information. Once logged in, I can show your complete account summary, settings, and contact information.",
                            sessionId
                        );
                        response.setQuickReplies(Arrays.asList("Login Required", "Basic Status", "Contact Support", "Create Account"));
                        return response;
                    }
                } catch (Exception e) {
                    // Enhanced fallback with error details for debugging
                    System.out.println("Exception in getDetailedAccountViewWithUserId: " + e.getMessage());
                    e.printStackTrace();
                    
                    // Return proper fallback response instead of falling through
                    ChatResponseDTO response = ChatResponseDTO.success(
                        "I'm having trouble accessing detailed account information. I can help with basic status, account creation, finding branches, or contact support instead.",
                        sessionId
                    );
                    response.setQuickReplies(Arrays.asList("Basic Status", "Create Account", "Find Branch", "Main App"));
                    return response;
                }
            }
            
            // Find Branches - Enhanced with fallback  
            if (userMessage.contains("branch") || userMessage.contains("location") || userMessage.contains("branches") || userMessage.contains("find branch")) {
                try {
                    if (userMessage.contains("india")) {
                        return getBranchesInCountryWithFallback("India", authToken, sessionId);
                    } else if (userMessage.contains("usa") || userMessage.contains("america")) {
                        return getBranchesInCountryWithFallback("USA", authToken, sessionId);
                    } else if (userMessage.contains("uk") || userMessage.contains("united kingdom")) {
                        return getBranchesInCountryWithFallback("UK", authToken, sessionId);
                    }
                } catch (Exception e) {
                    // Fallback if microservice is unavailable
                }
                // Fallback response
                ChatResponseDTO response = ChatResponseDTO.success(
                    "I can help you find bank branches. Select your region: India (major cities), USA (nationwide network), or UK (London and regional centers).",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("India Branches", "USA Branches", "UK Branches", "All Locations"));
                return response;
            }
            
            // Bank Code and Branch Verification - NEW: Bank Service Integration
            if (userMessage.contains("bank code") || userMessage.contains("check code") || userMessage.contains("verify code") ||
                userMessage.contains("branch exists") || userMessage.contains("verify branch") || userMessage.contains("check branch")) {
                try {
                    return getBankVerificationWithFallback(userMessage, sessionId);
                } catch (Exception e) {
                    // Fallback if bank service is unavailable
                }
                // Fallback response for bank verification queries
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Bank Verification Services\n\n" +
                    "I can help you verify:\n\n" +
                    "Bank Codes: Check if bank codes are valid\n" +
                    "Branch Information: Verify branch existence\n" +
                    "Location Details: Confirm branch locations\n\n" +
                    "Note: Verification services require specific details.\n" +
                    "What would you like to verify?",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Bank Code", "Branch Info", "All Banks", "Contact Support"));
                return response;
            }

            // All Banks Directory - NEW: Bank Service Integration
            if (userMessage.contains("all banks") || userMessage.contains("list banks") || userMessage.contains("bank directory") ||
                userMessage.contains("available banks") || userMessage.contains("bank list")) {
                try {
                    return getAllBanksWithFallback(authToken, sessionId);
                } catch (Exception e) {
                    // Fallback if bank service is unavailable
                }
                // Fallback response for all banks queries
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Bank Directory\n\n" +
                    "Complete bank directory is temporarily unavailable.\n\n" +
                    "Alternatives:\n" +
                    "• Search by specific country (India, USA, UK)\n" +
                    "• Contact customer service: 1-800-BANKING\n" +
                    "• Visit our website directory\n" +
                    "• Use mobile app bank locator\n\n" +
                    "I can help you find banks in specific countries!",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("India Banks", "USA Banks", "UK Banks", "Contact Support"));
                return response;
            }
            
            // Specific Profile Update Actions - Handle individual update requests
            System.out.println("🔍 DEBUG: Checking profile update patterns...");
            System.out.println("🔍 DEBUG: userMessage: '" + userMessage + "'");
            System.out.println("🔍 DEBUG: originalMessage: '" + originalMessage + "'");
            
            // Check for email pattern followed by actual email address
            if (userMessage.contains("update email") || userMessage.contains("change email") || 
                originalMessage.contains("📧") || userMessage.contains("update email") ||
                userMessage.contains("📧 update email") || originalMessage.contains("update email")) {
                System.out.println("✅ DEBUG: Email update pattern matched!");
                
                // Check if this message contains an email address
                String emailPattern = "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b";
                if (originalMessage.matches(".*" + emailPattern + ".*")) {
                    // User provided an email in this message, extract it and process the update
                    String newEmail = extractEmail(originalMessage);
                    if (newEmail != null && request.getUserId() != null) {
                        System.out.println("✅ DEBUG: Email found in message, processing update: " + newEmail);
                        return processEmailUpdate(request.getUserId(), newEmail, authToken, sessionId);
                    }
                }
                
                // Initial request - ask for new email
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Email Update Service\n\n" +
                    "Please provide your new email address and I'll update it for you.\n\n" +
                    "Example: mynewemail@gmail.com",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Cancel Update", "Contact Support", "Back to Profile", "Help"));
                return response;
            }
            
            if (userMessage.contains("update phone") || userMessage.contains("change phone") || 
                originalMessage.contains("📱") || userMessage.contains("update phone") ||
                userMessage.contains("📱 update phone") || originalMessage.contains("update phone")) {
                System.out.println("✅ DEBUG: Phone update pattern matched!");
                
                // Check if this message contains a phone number
                String phonePattern = "\\b[0-9]{10}\\b";
                if (originalMessage.matches(".*" + phonePattern + ".*")) {
                    // User provided a phone number in this message, extract it and process the update
                    String newPhone = extractPhoneNumber(originalMessage);
                    if (newPhone != null && request.getUserId() != null) {
                        System.out.println("✅ DEBUG: Phone found in message, processing update: " + newPhone);
                        return processPhoneUpdate(request.getUserId(), newPhone, authToken, sessionId);
                    }
                }
                
                // Initial request - ask for new phone
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Phone Update Service\n\n" +
                    "Please provide your new phone number (10 digits) and I'll update it for you.\n\n" +
                    "Example: 9876543210",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Cancel Update", "Contact Support", "Back to Profile", "Help"));
                return response;
            }
            
            if (userMessage.contains("change password") || userMessage.contains("reset password") || 
                userMessage.contains("forgot password") || originalMessage.contains("🔒") || 
                originalMessage.contains("change password") || userMessage.contains("🔒 change password") ||
                userMessage.contains("🔒 reset password") || userMessage.contains("password")) {
                System.out.println("✅ DEBUG: Password change pattern matched!");
                
                // Start the step-by-step password change flow
                sessionStates.put(sessionId, ConversationState.WAITING_FOR_OLD_PASSWORD);
                
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Password Change Service\n\n" +
                    "Please enter your current password:",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Cancel Update", "Contact Support", "Back to Profile", "Help"));
                return response;
            }
            
            // Handle direct email input (when user just provides an email address or includes it in a sentence)
            String emailPattern = "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b";
            if (originalMessage.matches(".*" + emailPattern + ".*") && 
                (originalMessage.split(" ").length <= 4 || originalMessage.toLowerCase().contains("email"))) {
                String email = extractEmail(originalMessage);
                if (email != null && request.getUserId() != null) {
                    // Directly process email update since user provided it
                    System.out.println("✅ DEBUG: Direct email input detected, processing update: " + email);
                    return processEmailUpdate(request.getUserId(), email, authToken, sessionId);
                }
            }
            
            // Handle direct phone input (when user just provides a phone number or includes it in a sentence)
            String phonePattern = "\\b[0-9]{10}\\b";
            if (originalMessage.matches(".*" + phonePattern + ".*") && 
                (originalMessage.split(" ").length <= 4 || originalMessage.toLowerCase().contains("phone"))) {
                String phone = extractPhoneNumber(originalMessage);
                if (phone != null && request.getUserId() != null) {
                    // Directly process phone update since user provided it
                    System.out.println("✅ DEBUG: Direct phone input detected, processing update: " + phone);
                    return processPhoneUpdate(request.getUserId(), phone, authToken, sessionId);
                }
            }
            
            // Additional Profile Update Patterns - Handle any missed emoji combinations
            if (originalMessage.contains("update") && (originalMessage.contains("📧") || originalMessage.contains("📱") || 
                originalMessage.contains("🔒") || originalMessage.contains("profile") || originalMessage.contains("email") || 
                originalMessage.contains("phone") || originalMessage.contains("password"))) {
                System.out.println("✅ DEBUG: General profile update pattern matched!");
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Profile Update Service\n\n" +
                    "I can help you with profile updates:\n\n" +
                    "Email: Update your email address\n" +
                    "Phone: Change your phone number\n" +
                    "Password: Reset or change password\n" +
                    "Settings: Manage profile preferences\n\n" +
                    "Most profile updates require the main banking application for security verification.\n\n" +
                    "What would you like to update?",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Update Email", "Update Phone", "Change Password", "Open Main App"));
                return response;
            }
            
            // General Profile Management - NEW: Integrated with User Service
            if (userMessage.contains("profile") || userMessage.contains("update profile") || userMessage.contains("user details") || 
                userMessage.contains("my info") || userMessage.contains("account info") || userMessage.contains("current user")) {
                try {
                    if (request.getUserId() != null) {
                        return getUserProfileWithFallback(request.getUserId(), authToken, sessionId);
                    } else {
                        // Try to get current user info with JWT authentication
                        return getCurrentUserProfileWithFallback(authToken, sessionId);
                    }
                } catch (Exception e) {
                    // Fallback if user service is unavailable
                }
                // Fallback response for profile queries
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Profile Management\n\n" +
                    "I can help you with profile-related services:\n\n" +
                    "Security: Password changes\n" +
                    "Contact: Email/phone updates\n" +
                    "Settings: Account preferences\n\n" +
                    "Note: Some profile features require the main application.\n" +
                    "What would you like to help with?",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Change Password", "Update Email", "Update Phone", "Main App"));
                return response;
            }

            // Admin and Support Services - NEW: Admin Service Integration
            if (userMessage.contains("admin") || userMessage.contains("customer service") || userMessage.contains("support contact") || 
                userMessage.contains("contact admin") || userMessage.contains("admin contact") || userMessage.contains("email admin")) {
                try {
                    return getAdminContactsWithFallback(authToken, sessionId);
                } catch (Exception e) {
                    // Fallback if admin service is unavailable
                }
                // Fallback response for admin contact queries
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Customer Support & Admin Services\n\n" +
                    "I can help you contact the right support team:\n\n" +
                    "General Support: 1-800-BANKING\n" +
                    "Email Support: Available by region\n" +
                    "Branch Support: Visit any location\n" +
                    "Online Support: Main banking application\n\n" +
                    "What type of assistance do you need?",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Call Support", "Email Support", "Find Branch", "Online Help"));
                return response;
            }

            // Application Status - Enhanced with admin integration
            if (userMessage.contains("admin status") || userMessage.contains("application admin") || 
                userMessage.contains("admin application") || userMessage.contains("general status")) {
                try {
                    return getGeneralApplicationStatusWithFallback(authToken, sessionId);
                } catch (Exception e) {
                    // Fallback if admin service is unavailable
                }
                // Fallback response for admin application status
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Application Status System\n\n" +
                    "General application status information is temporarily unavailable.\n\n" +
                    "Alternatives:\n" +
                    "• Check your individual account status\n" +
                    "• Contact customer service: 1-800-BANKING\n" +
                    "• Visit any branch location\n" +
                    "• Use the main banking application\n\n" +
                    "I can still help with personal account status and profile information!",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("My Account Status", "Contact Support", "Create Account", "Profile"));
                return response;
            }
            
        } catch (Exception e) {
            // Enhanced error response
            ChatResponseDTO response = ChatResponseDTO.success(
                "Some services are temporarily under maintenance. I can still help with account creation, document requirements, branch information, and general banking questions. How can I assist you?",
                sessionId
            );
            response.setQuickReplies(Arrays.asList("Create Account", "Requirements", "Find Branch", "Contact Support"));
            return response;
        }
        
        return null; // No API integration needed, continue with pattern matching
    }

    /**
     * Check user account status via Account Service
     */
    private ChatResponseDTO checkUserAccountStatus(String userId, String authToken, String sessionId) {
        try {
            Map<String, Object> accountResponse = integrationService.getUserAccounts(userId, authToken);
            
            if ((Boolean) accountResponse.getOrDefault("success", false)) {
                ChatResponseDTO chatResponse = ChatResponseDTO.success(
                    integrationService.formatResponseForChat(accountResponse, "accounts") + "\n\n" +
                    "Account information is available in the system\n" +
                    "For detailed information, contact customer service or log into your account",
                    sessionId
                );
                chatResponse.setQuickReplies(Arrays.asList("Account Details", "Contact Support", "Create New Account", "Update Profile"));
                return chatResponse;
            } else {
                return ChatResponseDTO.success(
                    "I couldn't find any accounts for your profile.\n\n" +
                    "This could mean:\n" +
                    "• No accounts have been created yet\n" +
                    "• Account applications are still pending approval\n" +
                    "• Invalid user ID provided\n\n" +
                    "Would you like to create a new account or check a different user ID?",
                    sessionId
                );
            }
        } catch (Exception e) {
            return ChatResponseDTO.error("Unable to check account status at this time. Please try again later.", sessionId);
        }
    }

    /**
     * Get branch information via Bank Service
     */
    private ChatResponseDTO getBranchesInCountry(String country, String authToken, String sessionId) {
        try {
            Map<String, Object> branchResponse = integrationService.getBanksByCountry(country, authToken);
            
            if ((Boolean) branchResponse.getOrDefault("success", false)) {
                return ChatResponseDTO.success(
                    integrationService.formatResponseForChat(branchResponse, "banks") + ". Bank information is available. You can search for specific cities or get all bank codes.",
                    sessionId
                );
            } else {
                return ChatResponseDTO.success(
                    "Currently no branch information is available for " + country + ".\n\n" +
                    "Please contact our customer service team for the most up-to-date branch information:\n" +
                    "Customer Service\n" +
                    "Visit our website\n" +
                    "Email support",
                    sessionId
                );
            }
        } catch (Exception e) {
            return ChatResponseDTO.error("Unable to retrieve branch information at this time.", sessionId);
        }
    }

    /**
     * Get user profile with fallback handling - NEW User Service Integration
     */
    private ChatResponseDTO getUserProfileWithFallback(String userId, String authToken, String sessionId) {
        try {
            Map<String, Object> profileResponse = integrationService.getUserProfile(userId, authToken);
            
            if ((Boolean) profileResponse.getOrDefault("success", false)) {
                ChatResponseDTO chatResponse = ChatResponseDTO.success(
                    integrationService.formatResponseForChat(profileResponse, "profile") + "\n\n" +
                   
                    "Profile information retrieved successfully\n\n" +
                    "Available Actions:\n" +
                    "• Update contact information\n" +
                    "• Change password\n" +
                    "• Review account settings",
                    sessionId
                );
                chatResponse.setQuickReplies(Arrays.asList("📧 Update Email", "📱 Update Phone", "🔒 Change Password", "⚙️ Settings"));
                return chatResponse;
            } else {
                return ChatResponseDTO.success(
                    integrationService.formatResponseForChat(profileResponse, "profile"),
                    sessionId
                );
            }
        } catch (Exception e) {
            return getUserProfileFallbackResponse(userId, sessionId);
        }
    }

    /**
     * Get current user profile with fallback handling - NEW User Service Integration
     */
    private ChatResponseDTO getCurrentUserProfileWithFallback(String authToken, String sessionId) {
        try {
            Map<String, Object> currentUserResponse = integrationService.getUserMe(authToken);
            
            if ((Boolean) currentUserResponse.getOrDefault("success", false)) {
                ChatResponseDTO chatResponse = ChatResponseDTO.success(
                    integrationService.formatResponseForChat(currentUserResponse, "profile") + "\n\n" +
                    "Current session profile information\n" +
                    "Authentication status: Active\n\n" +
                    "Quick Actions:\n" +
                    "• Update your information\n" +
                    "• Security settings\n" +
                    "• Account preferences",
                    sessionId
                );
                chatResponse.setQuickReplies(Arrays.asList("Security", "Update Info", "Preferences", "Main App"));
                return chatResponse;
            } else {
                return ChatResponseDTO.success(
                    integrationService.formatResponseForChat(currentUserResponse, "profile"),
                    sessionId
                );
            }
        } catch (Exception e) {
            return getUserProfileFallbackResponse(null, sessionId);
        }
    }

    /**
     * Fallback response for profile requests when service is unavailable
     */
    private ChatResponseDTO getUserProfileFallbackResponse(String userId, String sessionId) {
        String userInfo = "";
        return ChatResponseDTO.success(
            "Profile services are temporarily limited through the chatbot" + userInfo + ". Log into the main banking application, call customer service, visit any branch, or use the mobile app for profile updates.",
            sessionId
        );
    }

    /**
     * Enhanced account status check with fallback
     */
    private ChatResponseDTO checkUserAccountStatusWithFallback(String userId, String authToken, String sessionId) {
        try {
            return checkUserAccountStatus(userId, authToken, sessionId);
        } catch (Exception e) {
            return ChatResponseDTO.success(
                "Account Status Service\n\n" +
                "Account status checking for User ID: " + userId + " is temporarily unavailable.\n\n" +
                "🔄 **Alternatives**:\n" +
                "• Try again in a few minutes\n" +
                "• Log into your online banking\n" +
                "• Call customer service: 1-800-BANKING\n" +
                "• Visit any branch location\n\n" +
                "💡 I can still help with new account creation and branch information!",
                sessionId
            );
        }
    }

    /**
     * NEW: Smart account status check for logged-in users
     * Automatically fetches user accounts and handles single vs multiple account scenarios
     */
    private ChatResponseDTO checkUserAccountStatusWithUserId(String userId, String authToken, String sessionId) {
        try {
            System.out.println("DEBUG: Starting checkUserAccountStatusWithUserId for userId: " + userId);
            System.out.println("🔑 DEBUG: AuthToken present: " + (authToken != null && !authToken.trim().isEmpty()));
            
            // Get all accounts for this user with JWT authentication
            Map<String, Object> accountResponse = integrationService.getUserAccounts(userId, authToken);
            
            System.out.println("📊 DEBUG: Account response success: " + accountResponse.getOrDefault("success", false));
            System.out.println("📋 DEBUG: Account response data: " + accountResponse.get("data"));
            
            if ((Boolean) accountResponse.getOrDefault("success", false)) {
                // Parse the account data to determine if user has single or multiple accounts
                Object data = accountResponse.get("data");
                System.out.println("📄 DEBUG: Data type: " + (data != null ? data.getClass().getName() : "null"));
                
                // Handle both String (JSON) and List responses
                java.util.List<Map<String, Object>> accounts = new java.util.ArrayList<>();
                
                if (data instanceof String) {
                    // Parse JSON string response
                    String jsonData = (String) data;
                    System.out.println("DEBUG: Parsing JSON string response");
                    try {
                        // Simple JSON parsing - check if it's an array or single object
                        if (jsonData.trim().startsWith("[")) {
                            // It's a JSON array - extract account info manually
                            // For now, let's extract key information
                            if (jsonData.contains("\"accountNumber\"")) {
                                Map<String, Object> account = new HashMap<>();
                                // Extract bank name
                                if (jsonData.contains("\"bank\":\"")) {
                                    String bank = jsonData.substring(jsonData.indexOf("\"bank\":\"") + 8);
                                    bank = bank.substring(0, bank.indexOf("\""));
                                    account.put("bankName", bank);
                                }
                                // Extract account type
                                if (jsonData.contains("\"accountType\":\"")) {
                                    String accType = jsonData.substring(jsonData.indexOf("\"accountType\":\"") + 15);
                                    accType = accType.substring(0, accType.indexOf("\""));
                                    account.put("accountType", accType);
                                }
                                // Extract status
                                if (jsonData.contains("\"status\":\"")) {
                                    String status = jsonData.substring(jsonData.indexOf("\"status\":\"") + 10);
                                    status = status.substring(0, status.indexOf("\""));
                                    account.put("accountStatus", status);
                                }
                                // Extract country
                                if (jsonData.contains("\"country\":\"")) {
                                    String country = jsonData.substring(jsonData.indexOf("\"country\":\"") + 11);
                                    country = country.substring(0, country.indexOf("\""));
                                    account.put("country", country);
                                }
                                // Extract account number
                                if (jsonData.contains("\"accountNumber\":\"")) {
                                    String accNum = jsonData.substring(jsonData.indexOf("\"accountNumber\":\"") + 17);
                                    accNum = accNum.substring(0, accNum.indexOf("\""));
                                    account.put("accountNumber", accNum);
                                }
                                // Extract deposit amount (available balance)
                                if (jsonData.contains("\"deposit\":")) {
                                    String deposit = jsonData.substring(jsonData.indexOf("\"deposit\":") + 10);
                                    deposit = deposit.substring(0, deposit.indexOf(",") > 0 ? deposit.indexOf(",") : deposit.indexOf("}"));
                                    account.put("deposit", deposit);
                                }
                                // Extract branch info
                                if (jsonData.contains("\"branch\":\"")) {
                                    String branch = jsonData.substring(jsonData.indexOf("\"branch\":\"") + 10);
                                    branch = branch.substring(0, branch.indexOf("\""));
                                    account.put("branch", branch);
                                }
                                accounts.add(account);
                            }
                        }
                    } catch (Exception parseEx) {
                        System.out.println("JSON parsing failed: " + parseEx.getMessage());
                        // Fallback to generic response
                        return checkUserAccountStatusWithFallback(userId, authToken, sessionId);
                    }
                } else if (data instanceof java.util.List) {
                    @SuppressWarnings("unchecked")
                    java.util.List<Map<String, Object>> accountList = (java.util.List<Map<String, Object>>) data;
                    accounts = accountList;
                } else {
                    System.out.println("DEBUG: Unexpected data type, falling back");
                    return checkUserAccountStatusWithFallback(userId, authToken, sessionId);
                }
                
                System.out.println("📊 DEBUG: Found " + accounts.size() + " accounts after parsing");
                
                if (accounts.isEmpty()) {
                    // No accounts found
                    ChatResponseDTO response = ChatResponseDTO.success(
                        "No accounts found for your profile. You can create your first bank account, check for pending applications, or contact support if you believe this is an error.",
                        sessionId
                    );
                    response.setQuickReplies(Arrays.asList("Create Account", "Contact Support", "Check Pending", "Update Profile"));
                    return response;
                    
                } else if (accounts.size() == 1) {
                        // Single account - show status directly
                        Map<String, Object> account = accounts.get(0);
                        String bankName = (String) account.getOrDefault("bankName", "Unknown Bank");
                        String accountType = (String) account.getOrDefault("accountType", "Unknown Type");
                        String status = (String) account.getOrDefault("accountStatus", "Unknown Status");
                        String country = (String) account.getOrDefault("country", "Unknown");
                        String accountNumber = (String) account.getOrDefault("accountNumber", null);
                        String branch = (String) account.getOrDefault("branch", null);
                        String deposit = (String) account.getOrDefault("deposit", null);
                        
                        String statusEmoji = getStatusEmoji(status);
                        String countryFlag = getCountryFlag(country);
                        
                        // Build account details dynamically based on available data
                        StringBuilder accountDetails = new StringBuilder();
                        accountDetails.append("Your Account Status ").append(countryFlag).append("\n\n");
                        accountDetails.append("Bank: ").append(bankName).append("\n");
                        accountDetails.append("Account Type: ").append(accountType).append("\n");
                        accountDetails.append("Status: ").append(statusEmoji).append(" ").append(status).append("\n");
                        accountDetails.append("Country: ").append(country).append("\n");
                        
                        // Add optional fields if available
                        if (accountNumber != null && !accountNumber.trim().isEmpty()) {
                            accountDetails.append("Account: ").append(accountNumber).append("\n");
                        }
                        if (branch != null && !branch.trim().isEmpty()) {
                            accountDetails.append("Branch: ").append(branch).append("\n");
                        }
                        if (deposit != null && !deposit.trim().isEmpty()) {
                            accountDetails.append("Available: Rs.").append(deposit).append("\n");
                        }
                        
                        accountDetails.append("\n").append(getStatusDescription(status).replaceAll("[*\ud83c\udf89\u26a1\ud83d\udcab\u2b50\u2705\u23f3\u274c\ud83d\udd0d\u26a0\ufe0f\ud83d\udd12]", "").trim()).append("\n\n");
                        accountDetails.append("Need help with your account?");
                        
                        ChatResponseDTO response = ChatResponseDTO.success(
                            accountDetails.toString(),
                            sessionId
                        );
                        response.setQuickReplies(Arrays.asList("View Details", "Create Another Account", "Contact Support", "Update Profile"));
                        return response;
                        
                    } else {
                        // Multiple accounts - ask user to specify which one
                        StringBuilder accountsList = new StringBuilder();
                        for (int i = 0; i < accounts.size(); i++) {
                            Map<String, Object> account = accounts.get(i);
                            String bankName = (String) account.getOrDefault("bankName", "Bank " + (i + 1));
                            String accountType = (String) account.getOrDefault("accountType", "Unknown Type");
                            String country = (String) account.getOrDefault("country", "Unknown");
                            String countryFlag = getCountryFlag(country);
                            
                            accountsList.append(String.format("🏦 **%s** %s - %s\n", bankName, countryFlag, accountType));
                        }
                        
                        ChatResponseDTO response = ChatResponseDTO.success(
                            "Great! You have " + accounts.size() + " accounts with us. Which account would you like to check the status for? Please specify the bank name or account type.",
                            sessionId
                        );
                        
                        // Create quick replies with bank names
                        java.util.List<String> quickReplies = new java.util.ArrayList<>();
                        for (Map<String, Object> account : accounts) {
                            String bankName = (String) account.getOrDefault("bankName", "Unknown Bank");
                            quickReplies.add(bankName);
                        }
                        quickReplies.add("Contact Support");
                        
                        response.setQuickReplies(quickReplies);
                        return response;
                }
            } else {
                // API call failed but got response
                String errorMsg = (String) accountResponse.getOrDefault("message", "Unable to retrieve account information");
                System.out.println("❌ DEBUG: API call failed - " + errorMsg);
                System.out.println("📊 DEBUG: Full response: " + accountResponse);
                
                ChatResponseDTO response = ChatResponseDTO.success(
                    errorMsg + ". You can try again in a moment, contact our support team, check for pending applications, or create a new account if needed.",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Try Again", "Contact Support", "Create Account", "Profile"));
                return response;
            }
        } catch (Exception e) {
            System.out.println("⚠️ EXCEPTION in checkUserAccountStatusWithUserId: " + e.getMessage());
            e.printStackTrace();
            
            // Service unavailable - use enhanced fallback
            return checkUserAccountStatusWithFallback(userId, authToken, sessionId);
        }
    }
    
    /**
     * NEW: Detailed Account View - Enhanced information display for logged-in users
     * Provides comprehensive account information beyond basic status
     */
    private ChatResponseDTO getDetailedAccountViewWithUserId(String userId, String authToken, String sessionId) {
        try {
            System.out.println("DEBUG: Starting getDetailedAccountViewWithUserId for userId: " + userId);
            System.out.println("DEBUG: AuthToken present: " + (authToken != null && !authToken.trim().isEmpty()));
            
            // Get all accounts for this user with JWT authentication
            Map<String, Object> accountResponse = integrationService.getUserAccounts(userId, authToken);
            
            System.out.println("DEBUG: Account response success: " + accountResponse.getOrDefault("success", false));
            System.out.println("DEBUG: Account response data: " + accountResponse.get("data"));
            
            if ((Boolean) accountResponse.getOrDefault("success", false)) {
                // Parse the account data for detailed view
                Object data = accountResponse.get("data");
                System.out.println("DEBUG: Data type: " + (data != null ? data.getClass().getName() : "null"));
                
                // Handle both String (JSON) and List responses
                java.util.List<Map<String, Object>> accounts = new java.util.ArrayList<>();
                
                if (data instanceof String) {
                    // Parse JSON string response
                    String jsonData = (String) data;
                    System.out.println("DEBUG: Parsing JSON string response for detailed view");
                    try {
                        // Simple JSON parsing - check if it's an array or single object
                        if (jsonData.trim().startsWith("[")) {
                            // It's a JSON array - extract detailed account info
                            if (jsonData.contains("\"accountNumber\"")) {
                                Map<String, Object> account = new HashMap<>();
                                // Extract all available fields for detailed view
                                if (jsonData.contains("\"bank\":\"")) {
                                    String bank = jsonData.substring(jsonData.indexOf("\"bank\":\"") + 8);
                                    bank = bank.substring(0, bank.indexOf("\""));
                                    account.put("bankName", bank);
                                }
                                if (jsonData.contains("\"accountType\":\"")) {
                                    String accType = jsonData.substring(jsonData.indexOf("\"accountType\":\"") + 15);
                                    accType = accType.substring(0, accType.indexOf("\""));
                                    account.put("accountType", accType);
                                }
                                if (jsonData.contains("\"status\":\"")) {
                                    String status = jsonData.substring(jsonData.indexOf("\"status\":\"") + 10);
                                    status = status.substring(0, status.indexOf("\""));
                                    account.put("accountStatus", status);
                                }
                                if (jsonData.contains("\"country\":\"")) {
                                    String country = jsonData.substring(jsonData.indexOf("\"country\":\"") + 11);
                                    country = country.substring(0, country.indexOf("\""));
                                    account.put("country", country);
                                }
                                if (jsonData.contains("\"accountNumber\":\"")) {
                                    String accNum = jsonData.substring(jsonData.indexOf("\"accountNumber\":\"") + 17);
                                    accNum = accNum.substring(0, accNum.indexOf("\""));
                                    account.put("accountNumber", accNum);
                                }
                                if (jsonData.contains("\"deposit\":")) {
                                    String deposit = jsonData.substring(jsonData.indexOf("\"deposit\":") + 10);
                                    deposit = deposit.substring(0, deposit.indexOf(",") > 0 ? deposit.indexOf(",") : deposit.indexOf("}"));
                                    account.put("deposit", deposit);
                                }
                                if (jsonData.contains("\"branch\":\"")) {
                                    String branch = jsonData.substring(jsonData.indexOf("\"branch\":\"") + 10);
                                    branch = branch.substring(0, branch.indexOf("\""));
                                    account.put("branch", branch);
                                }
                                if (jsonData.contains("\"applicationDate\":\"")) {
                                    String appDate = jsonData.substring(jsonData.indexOf("\"applicationDate\":\"") + 19);
                                    appDate = appDate.substring(0, appDate.indexOf("\""));
                                    account.put("applicationDate", appDate);
                                }
                                accounts.add(account);
                            }
                        }
                    } catch (Exception parseEx) {
                        System.out.println("❌ JSON parsing failed in detailed view: " + parseEx.getMessage());
                        // Fallback to basic status
                        return checkUserAccountStatusWithUserId(userId, authToken, sessionId);
                    }
                } else if (data instanceof java.util.List) {
                    @SuppressWarnings("unchecked")
                    java.util.List<Map<String, Object>> accountList = (java.util.List<Map<String, Object>>) data;
                    accounts = accountList;
                } else {
                    System.out.println("❌ DEBUG: Unexpected data type in detailed view, falling back");
                    return checkUserAccountStatusWithUserId(userId, authToken, sessionId);
                }
                
                System.out.println("📊 DEBUG: Found " + accounts.size() + " accounts for detailed view");
                
                if (accounts.isEmpty()) {
                    // No accounts found
                    ChatResponseDTO response = ChatResponseDTO.success(
                        "No active accounts found for your profile. You can create your first bank account, check for pending applications, or contact support for assistance.",
                        sessionId
                    );
                    response.setQuickReplies(Arrays.asList("Create Account", "Contact Support", "Check Pending", "Back"));
                    return response;
                    
                } else {
                    // Show detailed information for all accounts
                    StringBuilder detailedView = new StringBuilder();
                    detailedView.append("Account Details\n\n");
                    detailedView.append("Total Accounts: ").append(accounts.size()).append("\n\n");
                    
                    for (int i = 0; i < accounts.size(); i++) {
                        Map<String, Object> account = accounts.get(i);
                        String bankName = (String) account.getOrDefault("bankName", "Unknown Bank");
                        String accountType = (String) account.getOrDefault("accountType", "Unknown Type");
                        String status = (String) account.getOrDefault("accountStatus", "Unknown Status");
                        String country = (String) account.getOrDefault("country", "Unknown");
                        String accountNumber = (String) account.getOrDefault("accountNumber", null);
                        String branch = (String) account.getOrDefault("branch", null);
                        String deposit = (String) account.getOrDefault("deposit", null);
                        String appDate = (String) account.getOrDefault("applicationDate", null);
                        
                        String statusEmoji = getStatusEmoji(status);
                        String countryFlag = getCountryFlag(country);
                        
                        detailedView.append("Account ").append(i + 1).append("** ").append(countryFlag).append("\n");
                        detailedView.append("Bank: ").append(bankName).append("\n");
                        detailedView.append("Type: ").append(accountType).append("\n");
                        detailedView.append("Status: ").append(statusEmoji).append(" ").append(status).append("\n");
                        detailedView.append("Country: ").append(country).append("\n");
                        
                        if (accountNumber != null && !accountNumber.trim().isEmpty()) {
                            detailedView.append("Account No: ").append(accountNumber).append("\n");
                        }
                        if (branch != null && !branch.trim().isEmpty()) {
                            detailedView.append("Branch: ").append(branch).append("\n");
                        }
                        if (deposit != null && !deposit.trim().isEmpty()) {
                            detailedView.append("Available: Rs.").append(deposit).append("\n");
                        }
                        if (appDate != null && !appDate.trim().isEmpty()) {
                            detailedView.append("Applied: ").append(appDate).append("\n");
                        }
                        detailedView.append(getStatusDescription(status).replaceAll("[*\ud83c\udf89\u26a1\ud83d\udcab\u2b50\u2705\u23f3\u274c\ud83d\udd0d\u26a0\ufe0f\ud83d\udd12\u251c\u2514\u2500]", "").trim()).append("\n\n");
                    }
                    
                    detailedView.append("Need help? Contact support or update your profile.");
                    
                    ChatResponseDTO response = ChatResponseDTO.success(detailedView.toString(), sessionId);
                    response.setQuickReplies(Arrays.asList("Update Profile", "Contact Support", "New Account", "Find Branch"));
                    return response;
                }
            } else {
                // API call failed but got response
                String errorMsg = (String) accountResponse.getOrDefault("message", "Unable to retrieve detailed account information");
                System.out.println("DEBUG: API call failed in detailed view - " + errorMsg);
                
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Unable to retrieve detailed account information. Try basic account status check, contact support, or use the main banking application.",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Basic Status", "Contact Support", "Main App", "Back"));
                return response;
            }
        } catch (Exception e) {
            System.out.println("EXCEPTION in getDetailedAccountViewWithUserId: " + e.getMessage());
            e.printStackTrace();
            
            // Service unavailable - use enhanced fallback
            ChatResponseDTO response = ChatResponseDTO.success(
                "Detailed account information is temporarily unavailable. You can use basic account status check, try again in a few minutes, or contact support.",
                sessionId
            );
            response.setQuickReplies(Arrays.asList("Basic Status", "Try Again", "Support", "Main App"));
            return response;
        }
    }
    
    /**
     * Helper method to get appropriate emoji for account status
     */
    private String getStatusEmoji(String status) {
        if (status == null) return "❓";
        switch (status.toUpperCase()) {
            case "APPROVED": case "ACTIVE": return "✅";
            case "PENDING": return "⏳";
            case "REJECTED": case "DECLINED": return "❌";
            case "UNDER_REVIEW": return "?";
            case "SUSPENDED": return "⚠️";
            case "CLOSED": return "🔒";
            default: return "📋";
        }
    }
    
    /**
     * Helper method to get status description
     */
    private String getStatusDescription(String status) {
        if (status == null) return "Status information unavailable.";
        switch (status.toUpperCase()) {
            case "APPROVED": case "ACTIVE": 
                return "Your account is active and ready to use.";
            case "PENDING": 
                return "Your application is being processed. We'll notify you once approved.";
            case "REJECTED": case "DECLINED": 
                return "Application declined. Please contact support for more information.";
            case "UNDER_REVIEW": 
                return "Our team is currently reviewing your application.";
            case "SUSPENDED": 
                return "Account suspended. Please contact support immediately.";
            case "CLOSED": 
                return "This account is no longer active.";
            default: 
                return "Status: " + status + ". Contact support for more details.";
        }
    }
    
    /**
     * Helper method to get country flag emoji
     */
    private String getCountryFlag(String country) {
        if (country == null) return "🌍";
        switch (country.toUpperCase()) {
            case "INDIA": return "🇮🇳";
            case "USA": case "UNITED STATES": case "US": return "🇺🇸";
            case "UK": case "UNITED KINGDOM": case "BRITAIN": return "🇬🇧";
            case "CANADA": return "🇨🇦";
            case "AUSTRALIA": return "🇦🇺";
            case "GERMANY": return "🇩🇪";
            case "FRANCE": return "🇫🇷";
            case "JAPAN": return "🇯🇵";
            case "CHINA": return "🇨🇳";
            case "SINGAPORE": return "🇸🇬";
            default: return "🌍";
        }
    }

    /**
     * Enhanced branch information with fallback
     */
    private ChatResponseDTO getBranchesInCountryWithFallback(String country, String authToken, String sessionId) {
        try {
            return getBranchesInCountry(country, authToken, sessionId);
        } catch (Exception e) {
            return ChatResponseDTO.success(
                "Branch information for " + country + " is temporarily limited. Visit our website branch locator, call customer service, or use the mobile app location services.",
                sessionId
            );
        }
    }

    /**
     * Get bank verification information with fallback handling - NEW Bank Service Integration
     */
    private ChatResponseDTO getBankVerificationWithFallback(String userMessage, String sessionId) {
        ChatResponseDTO response = ChatResponseDTO.success(
            "Bank Verification Service\n\n" +
            "Bank verification services are available! Please provide specific details:\n\n" +
            "For Bank Code Verification: Provide the bank code\n" +
            "For Branch Verification**: Provide country, city, bank name, and branch\n" +
            "For General Information**: I can show all available banks\n\n" +
            "What specific information would you like to verify?",
            sessionId
        );
        response.setQuickReplies(Arrays.asList("Verify Code", "Check Branch", "All Banks", "Get Help"));
        return response;
    }

    /**
     * Get all banks with fallback handling - NEW Bank Service Integration
     */
    private ChatResponseDTO getAllBanksWithFallback(String authToken, String sessionId) {
        try {
            Map<String, Object> allBanksResponse = integrationService.getAllBanks(authToken);
            
            if ((Boolean) allBanksResponse.getOrDefault("success", false)) {
                ChatResponseDTO chatResponse = ChatResponseDTO.success(
                    "Complete Bank Directory**\n\n" +
                    integrationService.formatResponseForChat(allBanksResponse, "banks") + "\n\n" +
                    "Directory Features**:\n" +
                    "• All registered banks in the system\n" +
                    "• Bank codes and contact information\n" +
                    "• Regional and international banks",
                    sessionId
                );
                chatResponse.setQuickReplies(Arrays.asList("India Banks", "USA Banks", "Verify Code", "Contact Support"));
                return chatResponse;
            } else {
                return ChatResponseDTO.success(
                    integrationService.formatResponseForChat(allBanksResponse, "banks"),
                    sessionId
                );
            }
        } catch (Exception e) {
            return getAllBanksDirectoryFallbackResponse(sessionId);
        }
    }

    /**
     * Fallback response for bank directory when service is unavailable
     */
    private ChatResponseDTO getAllBanksDirectoryFallbackResponse(String sessionId) {
        return ChatResponseDTO.success(
            "Bank Directory Service\n\n" +
            "Complete bank directory is temporarily updating.\n\n" +
            "Available Options:\n" +
            "• Search banks by country (India, USA, UK)\n" +
            "• Search banks by city within a country\n" +
            "• Contact customer service: 1-800-BANKING\n" +
            "• Visit our website directory\n\n" +
            "Specific Searches:\n" +
            "• Try: \"Banks in India\"\n" +
            "• Try: \"Banks in New York, USA\"\n" +
            "• Try: \"UK bank branches\"\n\n" +
            "Quick Help: I can still help with country-specific bank searches!",
            sessionId
        );
    }

    private String findBestResponse(String message) {
        for (Map.Entry<Pattern, String> entry : BANKING_RESPONSES.entrySet()) {
            if (entry.getKey().matcher(message).matches()) {
                return entry.getValue();
            }
        }
        
        // Default response for unrecognized queries
        return "I can help with account creation, status checking, branch locations, document guidance, and profile updates. What would you like to know?";
    }

    private List<String> getQuickRepliesForMessage(String message) {
        if (message.contains("hello") || message.contains("hi") || message.contains("hey")) {
            return QUICK_REPLIES.get("greeting");
        } else if (message.contains("account") || message.contains("create")) {
            return QUICK_REPLIES.get("account");
        } else if (message.contains("status") || message.contains("application")) {
            return QUICK_REPLIES.get("status");
        } else if (message.contains("branch") || message.contains("location")) {
            return QUICK_REPLIES.get("branch");
        } else if (message.contains("profile") || message.contains("update")) {
            return QUICK_REPLIES.get("profile");
        } else if (message.contains("balance") || message.contains("transfer") || message.contains("loan") || message.contains("card") || message.contains("statement")) {
            return QUICK_REPLIES.get("not_available");
        } else {
            return QUICK_REPLIES.get("default");
        }
    }

    private String generateSessionId() {
        return "session_" + System.currentTimeMillis() + "_" + (int) (Math.random() * 10000);
    }

    private String generateMessageId() {
        return "msg_" + System.currentTimeMillis() + "_" + (int) (Math.random() * 1000);
    }

    public String getCapabilities() {
        return "Banking Assistant - Available Services:\n\n" +
               "✅ WHAT I CAN HELP WITH:\n" +
               "• Create New Bank Accounts (India, USA, UK)\n" +
               "• Check Account Application Status\n" +
               "• Document Upload Requirements\n" +
               "• Find Bank Branch Locations\n" +
               "• Bank Code Verification\n" +
               "• Branch Existence Verification\n" +
               "• Complete Bank Directory\n" +
               "• Update Profile Information\n" +
               "• Admin Contact Information\n" +
               "• Answer Banking Questions\n\n" +
               
               "📋 ACCOUNT TYPES AVAILABLE:\n" +
               "• India: SAVINGS, CURRENT\n" +
               "• USA: SAVINGS, CHECKING, BUSINESS\n" +
               "• UK: SAVINGS, CURRENT, BUSINESS\n\n" +
               
               "💡 TO GET STARTED:\n" +
               "• Say 'Create Account' to start application\n" +
               "• Check your application status\n" +
               "• Help with document requirements\n" +
               "• Find branch locations and codes\n" +
               "• Assist with profile updates\n" +
               "• Answer general banking questions\n\n" +
               
               "I'm available 24/7 to help with your current banking needs!";
    }
    /**
     * Get admin contact information with fallback handling - NEW Admin Service Integration
     */
    private ChatResponseDTO getAdminContactsWithFallback(String authToken, String sessionId) {
        try {
            Map<String, Object> adminContactResponse = integrationService.getAdminEmailsByBank(authToken);
            
            if ((Boolean) adminContactResponse.getOrDefault("success", false)) {
                ChatResponseDTO chatResponse = ChatResponseDTO.success(
                    "Admin Contact Information\n\n" +
                    integrationService.formatResponseForChat(adminContactResponse, "admin") + "\n\n" +
                    "Regional Support: Contact information by bank location\n" +
                    "General Support: 1-800-BANKING\n" +
                    "Online Support: Available through main application",
                    sessionId
                );
                chatResponse.setQuickReplies(Arrays.asList("Call Now", "Email Support", "Find Branch", "Online Help"));
                return chatResponse;
            } else {
                return ChatResponseDTO.success(
                    integrationService.formatResponseForChat(adminContactResponse, "admin"),
                    sessionId
                );
            }
        } catch (Exception e) {
            return getAdminContactFallbackResponse(sessionId);
        }
    }

    /**
     * Get general application status with fallback handling - NEW Admin Service Integration
     */
    private ChatResponseDTO getGeneralApplicationStatusWithFallback(String authToken, String sessionId) {
        try {
            Map<String, Object> adminStatusResponse = integrationService.getAdminApplicationStatus(authToken);
            
            if ((Boolean) adminStatusResponse.getOrDefault("success", false)) {
                ChatResponseDTO chatResponse = ChatResponseDTO.success(
                    "General Application Status\n\n" +
                    integrationService.formatResponseForChat(adminStatusResponse, "application") + "\n\n" +
                    "Status Information: System-wide application processing\n" +
                    "Processing Times: Current queue status\n" +
                    "Requirements: Document submission status",
                    sessionId
                );
                chatResponse.setQuickReplies(Arrays.asList("My Status", "Requirements", "Contact Support", "New Application"));
                return chatResponse;
            } else {
                return ChatResponseDTO.success(
                    integrationService.formatResponseForChat(adminStatusResponse, "application"),
                    sessionId
                );
            }
        } catch (Exception e) {
            return getGeneralStatusFallbackResponse(sessionId);
        }
    }

    /**
     * Fallback response for admin contact requests when service is unavailable
     */
    private ChatResponseDTO getAdminContactFallbackResponse(String sessionId) {
        return ChatResponseDTO.success(
            "Customer Support Directory\n\n" +
            "While admin contact service is updating, here are your support options:\n\n" +
            "Primary Support:\n" +
            "• General Customer Service: 1-800-BANKING\n" +
            "• Website contact form\n" +
            "• Live chat (main application)\n" +
            "• Email: support@bankingapp.com\n\n" +
            "In-Person Support:\n" +
            "• Visit any branch location\n" +
            "• Speak with customer service representatives\n" +
            "• Access admin assistance through branch staff\n\n" +
            "Quick Help: I can still assist with account creation, status checking, and general information!",
            sessionId
        );
    }

    /**
     * Fallback response for general application status when admin service is unavailable
     */
    private ChatResponseDTO getGeneralStatusFallbackResponse(String sessionId) {
        return ChatResponseDTO.success(
            "Application Status Notice\n\n" +
            "General application status information is temporarily limited.\n\n" +
            "Available Options:\n" +
            "• Check your individual account status (User ID required)\n" +
            "• Contact customer service: 1-800-BANKING\n" +
            "• Visit any branch for status updates\n" +
            "• Use the main banking application\n\n" +
            "What I Can Help With:\n" +
            "• Personal account creation\n" +
            "• Individual status checking\n" +
            "• Branch and contact information\n" +
            "• Profile management guidance\n\n" +
            "For system-wide status updates, please use official channels!",
            sessionId
        );
    }

    /**
     * Extract email from user message
     */
    private String extractEmail(String message) {
        String emailPattern = "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b";
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(emailPattern);
        java.util.regex.Matcher matcher = pattern.matcher(message);
        
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }

    /**
     * Extract phone number from user message
     */
    private String extractPhoneNumber(String message) {
        String phonePattern = "\\b[0-9]{10}\\b";
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(phonePattern);
        java.util.regex.Matcher matcher = pattern.matcher(message);
        
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }

    /**
     * Extract passwords from user message in format "Old: xxx New: yyy"
     */
    private String[] extractPasswords(String message) {
        String passwordPattern = "(?i).*old[:\\s]+([^\\s]+).*new[:\\s]+([^\\s]+).*";
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(passwordPattern);
        java.util.regex.Matcher matcher = pattern.matcher(message);
        
        if (matcher.find()) {
            return new String[]{matcher.group(1), matcher.group(2)};
        }
        return null;
    }

    /**
     * Process email update through user service
     */
    private ChatResponseDTO processEmailUpdate(String userId, String newEmail, String authToken, String sessionId) {
        try {
            Map<String, Object> result = integrationService.updateUserEmail(userId, newEmail, authToken);
            
            if ((Boolean) result.getOrDefault("success", false)) {
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Email Update Successful!\n\n" +
                    "Your email address has been updated to: " + newEmail + "\n\n" +
                    "Your account security settings remain active.",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Update Phone", "Change Password", "View Profile", "Done"));
                return response;
            } else {
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Email Update Failed\n\n" +
                    result.getOrDefault("message", "Unable to update email at this time.") + "\n\n" +
                    "Please try again or use the main banking application.",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Try Again", "Contact Support", "Main App", "Back"));
                return response;
            }
        } catch (Exception e) {
            return ChatResponseDTO.error("Email update service temporarily unavailable. Please try through the main app.", sessionId);
        }
    }

    /**
     * Process phone update through user service
     */
    private ChatResponseDTO processPhoneUpdate(String userId, String newPhone, String authToken, String sessionId) {
        try {
            Map<String, Object> result = integrationService.updateUserPhone(userId, newPhone, authToken);
            
            if ((Boolean) result.getOrDefault("success", false)) {
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Phone Update Successful!\n\n" +
                    "Your phone number has been updated to: " + newPhone + "\n\n" +
                    "Important:\n" +
                    "• SMS notifications will be sent to new number\n" +
                    "• Security alerts will use this number\n" +
                    "• Update your contact preferences if needed\n\n" +
                    "Your account remains secure with the new contact information.",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Update Email", "Change Password", "View Profile", "Done"));
                return response;
            } else {
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Phone Update Failed\n\n" +
                    result.getOrDefault("message", "Unable to update phone number at this time.") + "\n\n" +
                    "Please try again or use the main banking application.",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Try Again", "Contact Support", "Main App", "Back"));
                return response;
            }
        } catch (Exception e) {
            return ChatResponseDTO.error("Phone update service temporarily unavailable. Please try through the main app.", sessionId);
        }
    }

    /**
     * Process password update through user service
     */
    private ChatResponseDTO processPasswordUpdate(String userId, String currentPassword, String newPassword, String authToken, String sessionId) {
        try {
            Map<String, Object> result = integrationService.updateUserPassword(userId, currentPassword, newPassword, authToken);
            
            if ((Boolean) result.getOrDefault("success", false)) {
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Password Update Successful!\n\n" +
                    "Your password has been changed successfully.\n\n" +
                    "Your account security has been updated.",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Update Email", "Update Phone", "View Profile", "Done"));
                return response;
            } else {
                ChatResponseDTO response = ChatResponseDTO.success(
                    "Password Update Failed\n\n" +
                    result.getOrDefault("message", "Unable to update password at this time.") + "\n\n" +
                    "Please verify your current password and try again.",
                    sessionId
                );
                response.setQuickReplies(Arrays.asList("Try Again", "Contact Support", "Main App", "Back"));
                return response;
            }
        } catch (Exception e) {
            return ChatResponseDTO.error("Password update service temporarily unavailable. Please try through the main app.", sessionId);
        }
    }
}