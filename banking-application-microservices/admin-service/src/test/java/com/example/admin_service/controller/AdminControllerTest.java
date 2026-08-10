package com.example.admin_service.controller;

import com.example.admin_service.config.JwtAuthenticationFilter;
import com.example.admin_service.dto.*;
import com.example.admin_service.entity.Admin;
import com.example.admin_service.entity.ApplicationStatus;
import com.example.admin_service.service.AdminService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = AdminController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = JwtAuthenticationFilter.class
    )
)
@DisplayName("AdminController Tests")
class AdminControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private AdminService adminService;

    private AdminRegisterRequest registerRequest() {
        AdminRegisterRequest req = new AdminRegisterRequest();
        req.setUsername("admin1");
        req.setEmail("a@b.com");
        req.setBankname("BankA");
        req.setCountry("IN");
        req.setPassword("pass1234");
        return req;
    }

    private Admin buildAdmin() {
        Admin admin = new Admin();
        admin.setId(1L);
        admin.setUsername("admin1");
        admin.setEmail("a@b.com");
        admin.setBankname("BankA");
        admin.setCountry("IN");
        admin.setPassword("encodedPassword");
        admin.setVerifiedByRoot(true);
        admin.setApplicationStatus(ApplicationStatus.APPROVED);
        admin.setCreatedDate(LocalDateTime.now());
        return admin;
    }

    // =========================================================================
    // POST /api/admin/register
    // =========================================================================

    @Nested @DisplayName("POST /api/admin/register")
    class Register {

        @Test @DisplayName("200 when registration succeeds")
        @WithMockUser
        void registerSuccess() throws Exception {
            when(adminService.register(any())).thenReturn(ResponseEntity.ok("Admin registered successfully."));
            mockMvc.perform(post("/api/admin/register")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registerRequest())))
                .andExpect(status().isOk())
                .andExpect(content().string("Admin registered successfully."));
        }

        @Test @DisplayName("400 when username already exists")
        @WithMockUser
        void registerConflict() throws Exception {
            when(adminService.register(any())).thenReturn(ResponseEntity.badRequest().body("Username already exists."));
            mockMvc.perform(post("/api/admin/register")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registerRequest())))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Username already exists."));
        }

        @Test @DisplayName("400 when required fields are missing")
        @WithMockUser
        void registerValidationFails() throws Exception {
            AdminRegisterRequest bad = new AdminRegisterRequest();
            mockMvc.perform(post("/api/admin/register")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(bad)))
                .andExpect(status().isBadRequest());
        }
    }

    // =========================================================================
    // POST /api/admin/login
    // =========================================================================

    @Nested @DisplayName("POST /api/admin/login")
    class Login {

        @Test @DisplayName("200 and returns token on successful login")
        @WithMockUser
        void loginSuccess() throws Exception {
            AdminLoginResponse.AdminDto dto = new AdminLoginResponse.AdminDto(
                1L,"admin1","a@b.com","BankA","IN",true,"APPROVED");
            AdminLoginResponse resp = new AdminLoginResponse(true,"Login successful.","jwt-token",3600000L,dto);
            when(adminService.login(any())).thenReturn(ResponseEntity.ok(resp));

            AdminLoginRequest req = new AdminLoginRequest();
            req.setUsernameOrEmail("admin1");
            req.setPassword("pass1234");

            mockMvc.perform(post("/api/admin/login")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.token").value("jwt-token"));
        }

        @Test @DisplayName("400 when credentials are invalid")
        @WithMockUser
        void loginFails() throws Exception {
            AdminLoginResponse resp = new AdminLoginResponse(false,"Invalid credentials.",null,null,null);
            when(adminService.login(any())).thenReturn(ResponseEntity.badRequest().body(resp));

            AdminLoginRequest req = new AdminLoginRequest();
            req.setUsernameOrEmail("admin1");
            req.setPassword("wrong");

            mockMvc.perform(post("/api/admin/login")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
        }
    }

    // =========================================================================
    // POST /api/admin/logout
    // =========================================================================

    @Nested @DisplayName("POST /api/admin/logout")
    class Logout {

        @Test @DisplayName("200 on successful logout")
        @WithMockUser
        void logoutSuccess() throws Exception {
            when(adminService.logout(anyString())).thenReturn(ResponseEntity.ok("Logged out successfully."));
            mockMvc.perform(post("/api/admin/logout")
                    .with(csrf())
                    .header("Authorization","Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(content().string("Logged out successfully."));
        }
    }

    // =========================================================================
    // GET /api/admin/me
    // =========================================================================

    @Nested @DisplayName("GET /api/admin/me")
    class GetCurrentAdmin {

        @Test @DisplayName("200 returns current admin details")
        @WithMockUser
        void getCurrentAdmin() throws Exception {
            AdminLoginResponse.AdminDto dto = new AdminLoginResponse.AdminDto(
                1L,"admin1","a@b.com","BankA","IN",true,"APPROVED");
            doReturn(ResponseEntity.ok(dto)).when(adminService).getCurrentAdminDetails();
            mockMvc.perform(get("/api/admin/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin1"))
                .andExpect(jsonPath("$.email").value("a@b.com"));
        }
    }

    // =========================================================================
    // POST /api/admin/verify
    // =========================================================================

    @Nested @DisplayName("POST /api/admin/verify")
    class VerifyAdmin {

        @Test @DisplayName("200 when verification succeeds")
        @WithMockUser
        void verifySuccess() throws Exception {
            when(adminService.verifyAdmin("admin1","rootadmin","rootpass123"))
                .thenReturn(ResponseEntity.ok("Admin verified successfully."));
            mockMvc.perform(post("/api/admin/verify")
                    .with(csrf())
                    .param("username","admin1")
                    .param("rootUsername","rootadmin")
                    .param("rootPassword","rootpass123"))
                .andExpect(status().isOk())
                .andExpect(content().string("Admin verified successfully."));
        }
    }

    // =========================================================================
    // PUT /api/admin/{id}
    // =========================================================================

    @Nested @DisplayName("PUT /api/admin/{id}")
    class UpdateAdminDetails {

        @Test @DisplayName("200 when update succeeds")
        @WithMockUser
        void updateSuccess() throws Exception {
            doReturn(ResponseEntity.ok("Admin details updated successfully."))
                .when(adminService).updateAdminDetails(eq(1L), any());
            mockMvc.perform(put("/api/admin/1")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registerRequest())))
                .andExpect(status().isOk())
                .andExpect(content().string("Admin details updated successfully."));
        }

        @Test @DisplayName("400 when admin not found")
        @WithMockUser
        void adminNotFound() throws Exception {
            doReturn(ResponseEntity.badRequest().body("Admin not found."))
                .when(adminService).updateAdminDetails(eq(99L), any());
            mockMvc.perform(put("/api/admin/99")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registerRequest())))
                .andExpect(status().isBadRequest());
        }
    }

    // =========================================================================
    // PUT /api/admin/{id}/password
    // =========================================================================

    @Nested @DisplayName("PUT /api/admin/{id}/password")
    class UpdatePassword {

        @Test @DisplayName("200 when password update succeeds")
        @WithMockUser
        void updatePasswordSuccess() throws Exception {
            doReturn(ResponseEntity.ok("Password updated successfully."))
                .when(adminService).updateAdminPassword(eq(1L), any());
            ChangePasswordRequest req = ChangePasswordRequest.builder()
                .oldPassword("oldPass1").newPassword("newPass12").build();
            mockMvc.perform(put("/api/admin/1/password")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(content().string("Password updated successfully."));
        }
    }

    // =========================================================================
    // GET /api/admin/applications/pending
    // =========================================================================

    @Nested @DisplayName("GET /api/admin/applications/pending")
    class GetPendingApplications {

        @Test @DisplayName("200 returns list of pending admins")
        @WithMockUser(roles = "ROOT_ADMIN")
        void returnsPendingList() throws Exception {
            when(adminService.getUnverifiedApplications())
                .thenReturn(ResponseEntity.ok(List.of(buildAdmin())));
            mockMvc.perform(get("/api/admin/applications/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("admin1"));
        }
    }

    // =========================================================================
    // POST /api/admin/applications/{adminId}/approve
    // =========================================================================

    @Nested @DisplayName("POST /api/admin/applications/{adminId}/approve")
    class ApproveApplication {

        @Test @DisplayName("200 when approval succeeds")
        @WithMockUser(roles = "ROOT_ADMIN")
        void approveSuccess() throws Exception {
            when(adminService.approveApplication(eq(1L), any()))
                .thenReturn(ResponseEntity.ok("Application approved."));
            mockMvc.perform(post("/api/admin/applications/1/approve")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(new ApplicationActionRequest())))
                .andExpect(status().isOk())
                .andExpect(content().string("Application approved."));
        }
    }

    // =========================================================================
    // POST /api/admin/applications/{adminId}/reject
    // =========================================================================

    @Nested @DisplayName("POST /api/admin/applications/{adminId}/reject")
    class RejectApplication {

        @Test @DisplayName("200 when rejection succeeds")
        @WithMockUser(roles = "ROOT_ADMIN")
        void rejectSuccess() throws Exception {
            when(adminService.rejectApplication(eq(1L), any()))
                .thenReturn(ResponseEntity.ok("Application rejected."));
            mockMvc.perform(post("/api/admin/applications/1/reject")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(new ApplicationActionRequest("Bad data"))))
                .andExpect(status().isOk())
                .andExpect(content().string("Application rejected."));
        }
    }

    // =========================================================================
    // GET /api/admin/application-status
    // =========================================================================

    @Nested @DisplayName("GET /api/admin/application-status")
    class CheckApplicationStatus {

        @Test @DisplayName("200 returns status for existing admin")
        @WithMockUser
        void returnsStatus() throws Exception {
            doReturn(ResponseEntity.ok("PENDING"))
                .when(adminService).checkApplicationStatus("admin1");
            mockMvc.perform(get("/api/admin/application-status").param("usernameOrEmail","admin1"))
                .andExpect(status().isOk());
        }

        @Test @DisplayName("400 when admin not found")
        @WithMockUser
        void adminNotFound() throws Exception {
            doReturn(ResponseEntity.badRequest().body("Admin not found."))
                .when(adminService).checkApplicationStatus("ghost");
            mockMvc.perform(get("/api/admin/application-status").param("usernameOrEmail","ghost"))
                .andExpect(status().isBadRequest());
        }
    }

    // =========================================================================
    // GET /api/admin/emails/by-bank
    // =========================================================================

    @Nested @DisplayName("GET /api/admin/emails/by-bank")
    class GetEmailsByBank {

        @Test @DisplayName("200 returns emails for bank")
        @WithMockUser
        void returnsEmails() throws Exception {
            doReturn(ResponseEntity.ok(List.of("a@b.com")))
                .when(adminService).getAdminEmailsByBankName("BankA");
            mockMvc.perform(get("/api/admin/emails/by-bank").param("bankName","BankA"))
                .andExpect(status().isOk());
        }

        @Test @DisplayName("400 when bank not found")
        @WithMockUser
        void bankNotFound() throws Exception {
            doReturn(ResponseEntity.badRequest().body("No admins found for bank: Unknown"))
                .when(adminService).getAdminEmailsByBankName("Unknown");
            mockMvc.perform(get("/api/admin/emails/by-bank").param("bankName","Unknown"))
                .andExpect(status().isBadRequest());
        }
    }
}