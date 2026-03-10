package com.example.user_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final Set<String> blacklistedTokens = ConcurrentHashMap.newKeySet();
    private final JwtService jwtService;

    public void blacklistToken(String token) {
        blacklistedTokens.add(token);
    }

    public boolean isTokenBlacklisted(String token) {
        return blacklistedTokens.contains(token);
    }

    public void cleanup() {
        // Remove expired tokens from blacklist
        blacklistedTokens.clear();
    }
}