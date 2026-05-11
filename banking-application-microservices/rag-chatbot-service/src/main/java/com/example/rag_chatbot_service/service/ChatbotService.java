package com.example.rag_chatbot_service.service;

import com.example.rag_chatbot_service.dto.AccountOptionDTO;
import com.example.rag_chatbot_service.dto.ChatRequestDTO;
import com.example.rag_chatbot_service.dto.ChatResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatbotService {
    @Value("${chatbot.fastapi.url:http://localhost:8000/rag/ask}")
    private String fastApiUrl;

    private final RestTemplate restTemplate;

    public ChatbotService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @SuppressWarnings("unchecked")
    public ChatResponseDTO callFastApi(ChatRequestDTO requestData) {
        String question = requestData.getQuestion();
        if ((question == null || question.isBlank()) && requestData.getMessage() != null) {
            question = requestData.getMessage();
        }

        if (question == null || question.isBlank()) {
            throw new IllegalArgumentException("question or message is required");
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("question", question);
        payload.put("user_id", requestData.getUserId());
        payload.put("session_id", requestData.getSessionId());
        payload.put("selected_account_id", requestData.getSelectedAccountId());
        payload.put("model_name", requestData.getModelName() != null ? requestData.getModelName() : "llama3.2:3b");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                fastApiUrl,
                HttpMethod.POST,
                entity,
                (Class<Map<String, Object>>) (Class<?>) Map.class
            );

            Map<String, Object> body = response.getBody() != null ? response.getBody() : Collections.emptyMap();

            ChatResponseDTO dto = new ChatResponseDTO();
            dto.setQuestion((String) body.getOrDefault("question", question));
            dto.setResponse((String) body.getOrDefault("response", "No response from assistant."));
            dto.setResponseType((String) body.getOrDefault("response_type", "final_answer"));

            Object sessionId = body.get("session_id");
            dto.setSessionId(sessionId != null ? String.valueOf(sessionId) : requestData.getSessionId());

            Object rawOptions = body.get("options");
            if (rawOptions instanceof List<?> list) {
                List<AccountOptionDTO> options = new ArrayList<>();
                for (Object item : list) {
                    if (!(item instanceof Map<?, ?> optionMap)) {
                        continue;
                    }
                    AccountOptionDTO option = new AccountOptionDTO();
                    option.setSelectionId(stringValue(optionMap.get("selection_id")));
                    option.setIndex(intValue(optionMap.get("index")));
                    option.setBankName(stringValue(optionMap.get("bank_name")));
                    option.setAccountNumberMasked(stringValue(optionMap.get("account_number_masked")));
                    option.setStatus(stringValue(optionMap.get("status")));
                    option.setCountry(stringValue(optionMap.get("country")));
                    options.add(option);
                }
                dto.setOptions(options);
            } else {
                dto.setOptions(Collections.emptyList());
            }

            return dto;
        } catch (RestClientResponseException ex) {
            throw new RuntimeException(
                "FastAPI HTTP error " + ex.getStatusCode() + ": " + ex.getResponseBodyAsString(),
                ex
            );
        }
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private Integer intValue(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return value != null ? Integer.parseInt(String.valueOf(value)) : null;
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
