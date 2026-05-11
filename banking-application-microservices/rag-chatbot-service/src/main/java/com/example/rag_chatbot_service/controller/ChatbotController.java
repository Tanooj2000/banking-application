package com.example.rag_chatbot_service.controller;

import com.example.rag_chatbot_service.dto.ChatRequestDTO;
import com.example.rag_chatbot_service.dto.ChatResponseDTO;
import com.example.rag_chatbot_service.service.ChatbotService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/chat")
public class ChatbotController {
    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping
    public ResponseEntity<ChatResponseDTO> chatWithBot(@RequestBody ChatRequestDTO frontendRequest) {
        ChatResponseDTO response = chatbotService.callFastApi(frontendRequest);
        return ResponseEntity.ok(response);
    }
}
