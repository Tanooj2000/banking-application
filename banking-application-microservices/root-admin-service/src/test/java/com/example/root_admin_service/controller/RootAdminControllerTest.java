package com.example.root_admin_service.controller;

import com.example.root_admin_service.dto.AdminVerificationRequest;
import com.example.root_admin_service.dto.SignInRequest;
import com.example.root_admin_service.dto.SignInResponse;
import com.example.root_admin_service.service.RootAdminService;
import com.example.root_admin_service.util.SecurityUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RootAdminControllerTest {

    MockMvc mockMvc;

    ObjectMapper mapper = new ObjectMapper();

    @Mock
    RootAdminService rootAdminService;

    @Mock
    SecurityUtil securityUtil;

    @InjectMocks
    RootAdminController controller;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void signIn_returnsSignInResponse() throws Exception {
        SignInResponse resp = new SignInResponse(true, "Sign in successful", "tk-123");
        when(rootAdminService.signIn("rootadmin", "rootpass")).thenReturn(resp);

        SignInRequest req = new SignInRequest();
        req.setUsername("rootadmin");
        req.setPassword("rootpass");

        mockMvc.perform(post("/api/root/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.token").value("tk-123"));
    }

    @Test
    void verifyAdmin_requiresRootRole_andReturnsServiceResult() throws Exception {
        when(rootAdminService.verifyAdmin(any(), any(), any())).thenReturn("Verified");

        AdminVerificationRequest req = new AdminVerificationRequest();
        req.setAdminUsername("adminUser");
        req.setRootUsername("rootadmin");
        req.setRootPassword("rootpass");

        mockMvc.perform(post("/api/root/verify-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(content().string("Verified"));
    }

    @Test
    void testJwt_returnsUserInfoFromSecurityUtil() throws Exception {
        when(securityUtil.getCurrentUsername()).thenReturn("rootadmin");
        when(securityUtil.getCurrentUserRoles()).thenReturn(List.of("ROLE_ROOT_ADMIN"));

        mockMvc.perform(get("/api/root/test-jwt"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("JWT Authentication successful!"))
                .andExpect(jsonPath("$.user").value("rootadmin"));
    }
}
