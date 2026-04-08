package com.example.admin_service.service;

/**
 * Thread-local storage for JWT token during request processing
 */
public class JwtTokenHolder {
    
    private static final ThreadLocal<String> tokenHolder = new ThreadLocal<>();
    
    public static void setToken(String token) {
        tokenHolder.set(token);
    }
    
    public static String getToken() {
        return tokenHolder.get();
    }
    
    public static void clear() {
        tokenHolder.remove();
    }
}