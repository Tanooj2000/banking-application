package com.example.root_admin_service.filter;

import com.example.root_admin_service.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        log.info("=== JWT FILTER DEBUG START ===");
        log.info("Request URI: {}", request.getRequestURI());
        log.info("Authorization Header: {}", authHeader);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.info("No Bearer token found, proceeding without authentication");
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        log.info("Extracted JWT token: {}", jwt.substring(0, Math.min(jwt.length(), 50)) + "...");
        try {
            username = jwtUtil.extractUsername(jwt);
            log.info("Extracted username from JWT: {}", username);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                log.info("Username found and no existing authentication, validating token...");
                
                if (jwtUtil.isTokenValid(jwt)) {
                    String role = jwtUtil.extractRole(jwt);
                    log.info("Token is valid. Extracted role: {}", role);
                    
                    if (role != null && !role.trim().isEmpty()) {
                        List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role));
                        log.info("Created authorities: {}", authorities);

                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                authorities
                        );
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        log.info("Successfully set authentication for user: {} with role: {}", username, role);
                    } else {
                        log.warn("Role is null or empty - token format may be outdated. Please get a new token.");
                    }
                } else {
                    log.warn("Invalid JWT token for user: {}", username);
                }
            } else {
                log.info("Username is null or authentication already exists");
            }
        } catch (ExpiredJwtException e) {
            log.warn("JWT token expired: {}", e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Token expired\"}");
            return;
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage(), e);
        }

        log.info("=== JWT FILTER DEBUG END ===");
        filterChain.doFilter(request, response);
    }
}