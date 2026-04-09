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
        try {
            String role = "ADMIN";
            try {
                String token = JwtTokenHolder.getToken();
                if (token != null) {
                    role = jwtService.extractRole(token);
                }
            } catch (Exception e) {
                role = "ADMIN";
            }

            if ("ROOT_ADMIN".equals(role)) {
                List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_ROOT_ADMIN")
                );
                
                return org.springframework.security.core.userdetails.User.builder()
                        .username(username)
                        .password("")
                        .authorities(authorities)
                        .build();
            }

            Admin admin = adminRepository.findByUsername(username).orElse(null);
            if (admin == null) {
                admin = adminRepository.findByEmail(username).orElse(null);
                if (admin == null) {
                    throw new UsernameNotFoundException("Admin not found with username/email: " + username);
                }
            }

            List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + role)
            );

            return org.springframework.security.core.userdetails.User.builder()
                    .username(admin.getUsername())
                    .password(admin.getPassword())
                    .authorities(authorities)
                    .build();
        } catch (Exception e) {
            if (e instanceof UsernameNotFoundException) {
                throw e;
            }
            throw new UsernameNotFoundException("Error loading user: " + username, e);
        }
    }
}