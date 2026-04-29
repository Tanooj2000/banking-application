package com.bankingapp.chatbot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ChatRequestDTO {
    
    @NotBlank(message = "Message is required")
    @Size(max = 1000, message = "Message cannot exceed 1000 characters")
    private String message;
    
    @NotNull(message = "User ID is required")
    private String userId;
    
    private String sessionId;
    
    private String context;
    
    private String authToken; // JWT token for authenticated API calls

    // Constructors
    public ChatRequestDTO() {}

    public ChatRequestDTO(String message, String userId, String sessionId, String context) {
        this.message = message;
        this.userId = userId;
        this.sessionId = sessionId;
        this.context = context;
    }

    public ChatRequestDTO(String message, String userId, String sessionId, String context, String authToken) {
        this.message = message;
        this.userId = userId;
        this.sessionId = sessionId;
        this.context = context;
        this.authToken = authToken;
    }

    // Getters and Setters
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getContext() {
        return context;
    }

    public void setContext(String context) {
        this.context = context;
    }

    public String getAuthToken() {
        return authToken;
    }

    public void setAuthToken(String authToken) {
        this.authToken = authToken;
    }
}