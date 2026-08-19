package com.example.rag_chatbot_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class ChatResponseDTO {
    private String question;

    @JsonProperty("response_type")
    private String responseType;

    private String response;

    @JsonProperty("session_id")
    private String sessionId;

    private List<AccountOptionDTO> options = new ArrayList<>();

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getResponseType() {
        return responseType;
    }

    public void setResponseType(String responseType) {
        this.responseType = responseType;
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

    public List<AccountOptionDTO> getOptions() {
        return options;
    }

    public void setOptions(List<AccountOptionDTO> options) {
        this.options = options;
    }
}
