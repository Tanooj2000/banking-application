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
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Token has been invalidated");
                return;
            }
            
            final String adminUsername = jwtService.extractUsername(jwt);

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (adminUsername != null && authentication == null) {
                try {
                    if (jwtService.isTokenValid(jwt)) {
                        String role = jwtService.extractRole(jwt);
                        Long adminId = jwtService.extractAdminId(jwt);
                        
                        List<SimpleGrantedAuthority> authorities = List.of(
                                new SimpleGrantedAuthority("ROLE_" + role)
                        );
                        
                        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                                .username(adminUsername)
                                .password("")
                                .authorities(authorities)
                                .build();

                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                jwt,
                                authorities
                        );

                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                } catch (Exception authEx) {
                    // Authentication failed, continue without setting context
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