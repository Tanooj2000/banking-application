package com.example.rag_chatbot_service.controller;

import com.example.rag_chatbot_service.dto.ChatRequestDTO;
import com.example.rag_chatbot_service.dto.ChatResponseDTO;
import com.example.rag_chatbot_service.service.ChatbotService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.Collections;

@RestController
@RequestMapping("/chat")
public class ChatbotController {
    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping
    public ResponseEntity<ChatResponseDTO> chatWithBot(
        @RequestBody ChatRequestDTO frontendRequest,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        if ((frontendRequest.getAuthToken() == null || frontendRequest.getAuthToken().isBlank())
            && authorizationHeader != null && !authorizationHeader.isBlank()) {
            frontendRequest.setAuthToken(extractBearerToken(authorizationHeader));
        }

        ChatResponseDTO response = chatbotService.callFastApi(frontendRequest);
        return ResponseEntity.ok(response);
    }

    private String extractBearerToken(String authorizationHeader) {
        String prefix = "Bearer ";
        if (authorizationHeader.regionMatches(true, 0, prefix, 0, prefix.length())) {
            return authorizationHeader.substring(prefix.length()).trim();
        }
        return authorizationHeader.trim();
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ChatResponseDTO> handleUnexpected(Exception ex) {
        ChatResponseDTO dto = new ChatResponseDTO();
        dto.setResponse("Something went wrong on our end. Please try again shortly.");
        dto.setResponseType("final_answer");
        dto.setOptions(Collections.emptyList());
        return ResponseEntity.ok(dto);
    }
}
