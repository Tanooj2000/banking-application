package com.bankingapp.chatbot.controller;

import com.bankingapp.chatbot.dto.ChatRequestDTO;
import com.bankingapp.chatbot.dto.ChatResponseDTO;
import com.bankingapp.chatbot.service.ChatbotService;
import com.bankingapp.chatbot.service.MicroserviceIntegrationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/chatbot")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;
    
    @Autowired
    private MicroserviceIntegrationService integrationService;

    @PostMapping("/chat")
    public ResponseEntity<?> processChat(@Valid @RequestBody ChatRequestDTO request) {
        try {
            // Log the incoming request for debugging
            System.out.println("🔍 Processing chat request: " + request.getMessage());
            
            ChatResponseDTO response = chatbotService.processMessage(request);
            
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("success", response.isSuccess());
            
            Map<String, Object> dataMap = new HashMap<>();
            dataMap.put("response", response.getResponse() != null ? response.getResponse() : "");
            dataMap.put("sessionId", response.getSessionId() != null ? response.getSessionId() : "");
            dataMap.put("messageId", response.getMessageId() != null ? response.getMessageId() : "");
            dataMap.put("quickReplies", response.getQuickReplies() != null ? response.getQuickReplies() : List.of());
            dataMap.put("responseType", response.getResponseType() != null ? response.getResponseType() : "final_answer");
            dataMap.put("options", response.getOptions() != null ? response.getOptions() : List.of());
            dataMap.put("timestamp", response.getTimestamp() != null ? response.getTimestamp().toString() : LocalDateTime.now().toString());
            dataMap.put("botName", "Banking Assistant");
            
            responseBody.put("data", dataMap);
            
            System.out.println("✅ Successfully processed message: " + request.getMessage());
            return ResponseEntity.ok(responseBody);
            
        } catch (Exception e) {
            // Enhanced error logging
            System.err.println("❌ Error processing chat message: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("data", Map.of(
                "response", "FastAPI bridge failure: " + e.getMessage(),
                "sessionId", request.getSessionId() != null ? request.getSessionId() : "error_session",
                "messageId", "error_" + System.currentTimeMillis(),
                "quickReplies", List.of(),
                "timestamp", new java.util.Date(),
                "botName", "Banking Assistant"
            ));
            errorResponse.put("errorMessage", "Technical issue: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Chatbot Service");
        health.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(health);
    }

    @GetMapping("/capabilities")
    public ResponseEntity<?> getCapabilities() {
        try {
            String capabilities = chatbotService.getCapabilities();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("capabilities", capabilities);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("errorMessage", "Failed to retrieve capabilities: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("service", "Banking Chatbot");
        status.put("version", "1.0.0");
        status.put("status", "ACTIVE");
        status.put("uptime", System.currentTimeMillis());
        status.put("features", new String[]{
            "Natural Language Processing",
            "Banking Query Resolution", 
            "24/7 Availability",
            "Multi-session Support",
            "Quick Reply Suggestions"
        });
        
        return ResponseEntity.ok(status);
    }

    @GetMapping("/services-health")
    public ResponseEntity<?> getServicesHealth() {
        try {
            Map<String, Object> healthStatus = integrationService.checkServicesHealth();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("chatbotStatus", "ACTIVE");
            response.put("microservicesHealth", healthStatus);
            response.put("integrationCapabilities", Map.of(
                "accountService", "Account status checking, user account lookup",
                "bankService", "Branch information, location data", 
                "userService", "Profile information retrieval",
                "adminService", "Admin operations support"
            ));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("errorMessage", "Failed to check services health: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}