package com.example.rag_chatbot_service.controller;

import com.example.rag_chatbot_service.service.ChatbotService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.Map;

@RestController
@RequestMapping("/chat")
public class ChatbotController {
    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping
    public ResponseEntity<?> chatWithBot(@RequestBody Map<String, Object> frontendRequest) {
        Map<String, Object> response = chatbotService.callFastApi(frontendRequest);
        return ResponseEntity.ok(response);
    }
}
