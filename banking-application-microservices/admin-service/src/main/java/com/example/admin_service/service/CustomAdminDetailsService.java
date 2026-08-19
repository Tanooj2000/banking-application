package com.example.admin_service.service;

import com.example.admin_service.repository.AdminRepository;
import com.example.admin_service.entity.Admin;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
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
        String role = "ADMIN";
        String token = JwtTokenHolder.getToken();
        if (token != null) {
            try {
                role = jwtService.extractRole(token);
            } catch (Exception e) {
                role = "ADMIN";
            }
        }

        List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

        if ("ROOT_ADMIN".equals(role)) {
            return User.builder()
                    .username(username)
                    .password("")
                    .authorities(authorities)
                    .build();
        }

        Admin admin = adminRepository.findByUsername(username)
                .orElse(adminRepository.findByEmail(username).orElse(null));
        if (admin == null) {
            throw new UsernameNotFoundException("Admin not found with username/email: " + username);
        }

        return User.builder()
                .username(admin.getUsername())
                .password(admin.getPassword())
                .authorities(authorities)
                .build();
    }
}