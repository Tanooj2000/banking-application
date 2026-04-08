package com.example.admin_service.service;

import com.example.admin_service.repository.AdminRepository;
import com.example.admin_service.entity.Admin;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomAdminDetailsService implements UserDetailsService {

    private final AdminRepository adminRepository;
    private final JwtService jwtService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("[USER_DETAILS DEBUG] Loading user details for: " + username);
        
        try {
            // First, check if this is a ROOT_ADMIN token
            String role = "ADMIN"; // Default role
            try {
                String token = JwtTokenHolder.getToken();
                System.out.println("[USER_DETAILS DEBUG] JWT token available: " + (token != null));
                if (token != null) {
                    role = jwtService.extractRole(token);
                    System.out.println("[USER_DETAILS DEBUG] Role extracted from token: " + role);
                }
            } catch (Exception e) {
                System.out.println("[USER_DETAILS DEBUG] Error extracting role from token: " + e.getMessage());
                role = "ADMIN";
            }

            // If this is a ROOT_ADMIN token, create virtual UserDetails without database lookup
            if ("ROOT_ADMIN".equals(role)) {
                System.out.println("[USER_DETAILS DEBUG] Creating virtual UserDetails for ROOT_ADMIN: " + username);
                List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_ROOT_ADMIN")
                );
                System.out.println("[USER_DETAILS DEBUG] Creating ROOT_ADMIN authorities: " + authorities);
                
                return org.springframework.security.core.userdetails.User.builder()
                        .username(username)
                        .password("") // Not used for token-based auth
                        .authorities(authorities)
                        .build();
            }

            // For ADMIN tokens, lookup from database as usual
            System.out.println("[USER_DETAILS DEBUG] Looking up ADMIN user in database: " + username);
            Admin admin = adminRepository.findByUsername(username).orElse(null);
            if (admin == null) {
                System.out.println("[USER_DETAILS DEBUG] User not found by username, trying email");
                admin = adminRepository.findByEmail(username).orElse(null);
                if (admin == null) {
                    System.out.println("[USER_DETAILS DEBUG] User not found by username or email: " + username);
                    throw new UsernameNotFoundException("Admin not found with username/email: " + username);
                }
            }

            System.out.println("[USER_DETAILS DEBUG] Found admin: " + admin.getUsername() + ", verified: " + admin.isVerifiedByRoot() + ", status: " + admin.getApplicationStatus());

            // Create authorities for regular admin
            List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + role)
            );
            System.out.println("[USER_DETAILS DEBUG] Creating authorities: " + authorities);

            System.out.println("[USER_DETAILS DEBUG] Successfully created UserDetails for: " + admin.getUsername());
            return org.springframework.security.core.userdetails.User.builder()
                    .username(admin.getUsername())
                    .password(admin.getPassword())
                    .authorities(authorities)
                    .build();
        } catch (Exception e) {
            System.out.println("[USER_DETAILS DEBUG] Exception in loadUserByUsername: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            e.printStackTrace();
            if (e instanceof UsernameNotFoundException) {
                throw e;
            }
            throw new UsernameNotFoundException("Error loading user: " + username, e);
        }
    }
}