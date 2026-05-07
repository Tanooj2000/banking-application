package com.example.rag_chatbot_service.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@Service
public class ChatbotService {
    private static final String FASTAPI_URL = "http://localhost:8000/rag/ask";
    private final RestTemplate restTemplate;

    public ChatbotService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> callFastApi(Map<String, Object> requestData) {
        // Map 'message' to 'question' if present
        Map<String, Object> payload = new java.util.HashMap<>();
        if (requestData.containsKey("message")) {
            payload.put("question", requestData.get("message"));
        }
        // Copy other fields if needed
        for (Map.Entry<String, Object> entry : requestData.entrySet()) {
            if (!entry.getKey().equals("message")) {
                payload.put(entry.getKey(), entry.getValue());
            }
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(FASTAPI_URL, entity, (Class<Map<String, Object>>)(Class<?>)Map.class);
        return response.getBody();
    }
}
