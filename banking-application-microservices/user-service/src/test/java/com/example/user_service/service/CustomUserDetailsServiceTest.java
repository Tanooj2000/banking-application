package com.example.user_service.service;

import com.example.user_service.entity.User;
import com.example.user_service.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CustomUserDetailsService Unit Tests")
class CustomUserDetailsServiceTest {

    @Mock private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("loads user by username")
    void loadUserByUsernameSuccess() {
        User user = new User(1L, "user1", "u@b.com", 9876543210L, "encoded-pass");
        when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));

        UserDetails userDetails = customUserDetailsService.loadUserByUsername("user1");

        assertThat(userDetails.getUsername()).isEqualTo("user1");
        assertThat(userDetails.getPassword()).isEqualTo("encoded-pass");
    }

    @Test
    @DisplayName("loads user by email")
    void loadUserByEmailSuccess() {
        User user = new User(1L, "user1", "u@b.com", 9876543210L, "encoded-pass");
        when(userRepository.findByEmail("u@b.com")).thenReturn(Optional.of(user));

        UserDetails userDetails = customUserDetailsService.loadUserByEmail("u@b.com");

        assertThat(userDetails.getUsername()).isEqualTo("user1");
        assertThat(userDetails.getPassword()).isEqualTo("encoded-pass");
    }

    @Test
    @DisplayName("throws when username is missing")
    void loadUserByUsernameMissing() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername("ghost"))
            .isInstanceOf(UsernameNotFoundException.class)
            .hasMessageContaining("User not found: ghost");
    }
}