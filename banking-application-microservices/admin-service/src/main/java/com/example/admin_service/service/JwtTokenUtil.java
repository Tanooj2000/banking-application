package com.example.admin_service.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

/**
 * Utility class for accessing JWT token data in a stateless way
 * without requiring database lookups
 */
@Component
@RequiredArgsConstructor
public class JwtTokenUtil {
    
    private final JwtService jwtService;
    
    /**
     * Get current JWT token from Spring Security context
     */
    public String getCurrentToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getCredentials() instanceof String) {
            return (String) authentication.getCredentials();
        }
        return null;
    }
    
    /**
     * Get current user's username from JWT token
     */
    public String getCurrentUsername() {
        String token = getCurrentToken();
        if (token != null) {
            return jwtService.extractUsername(token);
        }
        return null;
    }
    
    /**
     * Get current user's admin ID from JWT token
     */
    public Long getCurrentAdminId() {
        String token = getCurrentToken();
        if (token != null) {
            return jwtService.extractAdminId(token);
        }
        return null;
    }
    
    /**
     * Get current user's role from JWT token
     */
    public String getCurrentRole() {
        String token = getCurrentToken();
        if (token != null) {
            return jwtService.extractRole(token);
        }
        return null;
    }
    
    /**
     * Check if current user has specific role
     */
    public boolean hasRole(String role) {
        String userRole = getCurrentRole();
        return role != null && role.equals(userRole);
    }
    
    /**
     * Check if current user is ROOT_ADMIN
     */
    public boolean isRootAdmin() {
        return hasRole("ROOT_ADMIN");
    }
    
    /**
     * Check if current user is ADMIN
     */
    public boolean isAdmin() {
        return hasRole("ADMIN");
    }
}