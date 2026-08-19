package com.example.account_service.service;

import com.example.account_service.dto.AdminEmailResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminService Unit Tests")
class AdminServiceTest {

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private WebClient webClient;

    @InjectMocks
    private AdminService adminService;

    @Test
    @DisplayName("returns admin emails for a bank")
    void getAdminEmailsByBankReturnsEmails() {
        AdminEmailResponse response = new AdminEmailResponse();
        response.setAdminEmails(List.of("admin1@bank.com", "admin2@bank.com"));
        response.setCount(2);

        when(webClient.get().uri(anyString()).retrieve().bodyToMono(AdminEmailResponse.class)).thenReturn(Mono.just(response));

        List<String> emails = adminService.getAdminEmailsByBank("BankA");

        assertThat(emails).containsExactly("admin1@bank.com", "admin2@bank.com");
    }

    @Test
    @DisplayName("returns empty list when no admin emails are available")
    void getAdminEmailsByBankReturnsEmptyList() {
        AdminEmailResponse response = new AdminEmailResponse();
        response.setAdminEmails(List.of());
        response.setCount(0);

        when(webClient.get().uri(anyString()).retrieve().bodyToMono(AdminEmailResponse.class)).thenReturn(Mono.just(response));

        assertThat(adminService.getAdminEmailsByBank("UnknownBank")).isEmpty();
    }

    @Test
    @DisplayName("returns first admin email when available")
    void getFirstAdminEmailByBankReturnsFirstEmail() {
        AdminEmailResponse response = new AdminEmailResponse();
        response.setAdminEmails(List.of("admin1@bank.com", "admin2@bank.com"));
        response.setCount(2);

        when(webClient.get().uri(anyString()).retrieve().bodyToMono(AdminEmailResponse.class)).thenReturn(Mono.just(response));

        assertThat(adminService.getFirstAdminEmailByBank("BankA")).isEqualTo("admin1@bank.com");
    }
}