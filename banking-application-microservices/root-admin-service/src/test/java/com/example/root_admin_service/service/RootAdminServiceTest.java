package com.example.root_admin_service.service;

import com.example.root_admin_service.dto.SignInResponse;
import com.example.root_admin_service.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RootAdminServiceTest {

    @Mock
    RestTemplate restTemplate;

    @Mock
    JwtUtil jwtUtil;

    @InjectMocks
    RootAdminService rootAdminService;

    @Test
    void verifyAdmin_returnsResponseFromAdminService_whenRootCredentialsValid() {
        when(restTemplate.postForObject(anyString(), isNull(), eq(String.class))).thenReturn("Verified");

        String result = rootAdminService.verifyAdmin("adminUser", "rootadmin", "rootpass");

        assertThat(result).isEqualTo("Verified");
    }

    @Test
    void verifyAdmin_returnsInvalidMessage_whenRootCredentialsInvalid() {
        String result = rootAdminService.verifyAdmin("adminUser", "wrong", "creds");

        assertThat(result).isEqualTo("Invalid root admin credentials.");
    }

    @Test
    void signIn_returnsTokenOnValidRootCredentials() {
        when(jwtUtil.generateToken("rootadmin", "ROLE_ROOT_ADMIN")).thenReturn("token-abc");

        SignInResponse resp = rootAdminService.signIn("rootadmin", "rootpass");

        assertThat(resp).isNotNull();
        assertThat(resp.isSuccess()).isTrue();
        assertThat(resp.getToken()).isEqualTo("token-abc");
    }

    @Test
    void signIn_returnsFailureOnInvalidCredentials() {
        SignInResponse resp = rootAdminService.signIn("user", "bad");

        assertThat(resp).isNotNull();
        assertThat(resp.isSuccess()).isFalse();
        assertThat(resp.getToken()).isNull();
    }
}
