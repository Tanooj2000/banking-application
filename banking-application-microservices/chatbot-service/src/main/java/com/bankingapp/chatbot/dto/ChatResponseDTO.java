package com.bankingapp.chatbot.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ChatResponseDTO {
    
    private boolean success;
    private String response;
    private String sessionId;
    private LocalDateTime timestamp;
    private String botName;
    private String messageId;
    private List<String> quickReplies;
    private String errorMessage;

    // Constructors
    public ChatResponseDTO() {
        this.timestamp = LocalDateTime.now();
        this.botName = "Banking Assistant";
        this.messageId = "msg_" + System.currentTimeMillis() + "_" + (int) (Math.random() * 1000);
    }

    public ChatResponseDTO(boolean success, String response, String sessionId) {
        this();
        this.success = success;
        this.response = response;
        this.sessionId = sessionId;
    }

    // Static factory methods
    public static ChatResponseDTO success(String response, String sessionId) {
        return new ChatResponseDTO(true, response, sessionId);
    }

    public static ChatResponseDTO error(String errorMessage, String sessionId) {
        ChatResponseDTO responseDTO = new ChatResponseDTO();
        responseDTO.success = false;
        responseDTO.errorMessage = errorMessage;
        responseDTO.sessionId = sessionId;
        return responseDTO;
    }

    // Getters and Setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getBotName() {
        return botName;
    }

    public void setBotName(String botName) {
        this.botName = botName;
    }

    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public List<String> getQuickReplies() {
        return quickReplies;
    }

    public void setQuickReplies(List<String> quickReplies) {
        this.quickReplies = quickReplies;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}