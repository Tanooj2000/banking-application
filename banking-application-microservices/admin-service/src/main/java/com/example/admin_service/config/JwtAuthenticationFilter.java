package com.example.admin_service.config;

import com.example.admin_service.service.JwtService;
import com.example.admin_service.service.SessionService;
import com.example.admin_service.service.JwtTokenHolder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final HandlerExceptionResolver handlerExceptionResolver;
    private final JwtService jwtService;
    private final SessionService sessionService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7);
            System.out.println("[FILTER DEBUG] Processing JWT token: " + jwt.substring(0, Math.min(20, jwt.length())) + "...");
            
            // Store JWT token in ThreadLocal for access in UserDetailsService
            JwtTokenHolder.setToken(jwt);
            
            // Check if token is blacklisted
            if (sessionService.isTokenBlacklisted(jwt)) {
                System.out.println("[FILTER DEBUG] Token is blacklisted");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Token has been invalidated");
                return;
            }
            System.out.println("[FILTER DEBUG] Token not blacklisted");
            
            final String adminUsername = jwtService.extractUsername(jwt);
            System.out.println("[FILTER DEBUG] Extracted username: " + adminUsername);

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("[FILTER DEBUG] Current authentication: " + (authentication != null ? authentication.getName() : "null"));

            if (adminUsername != null && authentication == null) {
                try {
                    // Debug: Show all token claims
                    jwtService.debugTokenClaims(jwt);
                    
                    // Validate JWT token without database lookup - stateless authentication
                    if (jwtService.isTokenValid(jwt)) {
                        System.out.println("[FILTER DEBUG] Token is valid. Creating stateless authentication.");
                        
                        // Extract role and other claims directly from JWT
                        String role = jwtService.extractRole(jwt);
                        Long adminId = jwtService.extractAdminId(jwt);
                        
                        System.out.println("[FILTER DEBUG] JWT Claims - Username: " + adminUsername + ", Role: " + role + ", AdminId: " + adminId);
                        
                        // Create authorities based on role from JWT token only
                        List<SimpleGrantedAuthority> authorities = List.of(
                                new SimpleGrantedAuthority("ROLE_" + role)
                        );
                        System.out.println("[FILTER DEBUG] Creating stateless authorities: " + authorities);
                        
                        // Create UserDetails without database lookup
                        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                                .username(adminUsername)
                                .password("") // Not used for stateless JWT auth
                                .authorities(authorities)
                                .build();

                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                jwt, // Store JWT as credentials for potential future use
                                authorities
                        );

                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        System.out.println("[FILTER DEBUG] Stateless authentication set successfully");
                    } else {
                        System.out.println("[FILTER DEBUG] Token validation failed");
                    }
                } catch (Exception authEx) {
                    System.out.println("[FILTER DEBUG] Error during stateless authentication: " + authEx.getClass().getSimpleName() + " - " + authEx.getMessage());
                    authEx.printStackTrace();
                }
            } else {
                if (adminUsername == null) {
                    System.out.println("[FILTER DEBUG] No username extracted from token");
                }
                if (authentication != null) {
                    System.out.println("[FILTER DEBUG] Authentication already exists");
                }
            }

            filterChain.doFilter(request, response);
        } catch (Exception exception) {
            handlerExceptionResolver.resolveException(request, response, null, exception);
        } finally {
            // Clean up ThreadLocal to prevent memory leaks
            JwtTokenHolder.clear();
        }
    }
}