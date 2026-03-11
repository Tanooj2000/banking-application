package com.example.admin_service.service;

import com.example.admin_service.repository.AdminRepository;
import com.example.admin_service.entity.Admin;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class CustomAdminDetailsService implements UserDetailsService {

    private final AdminRepository adminRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Admin admin = adminRepository.findByUsername(username)
                .orElse(adminRepository.findByEmail(username)
                        .orElseThrow(() -> new UsernameNotFoundException("Admin not found with username/email: " + username)));

        return org.springframework.security.core.userdetails.User.builder()
                .username(admin.getUsername())
                .password(admin.getPassword())
                .authorities(new ArrayList<>())
                .build();
    }
}