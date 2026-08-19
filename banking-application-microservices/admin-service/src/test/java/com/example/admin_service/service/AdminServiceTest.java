package com.example.admin_service.service;

import com.example.admin_service.dto.*;
import com.example.admin_service.entity.Admin;
import com.example.admin_service.entity.ApplicationStatus;
import com.example.admin_service.repository.AdminRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminService Unit Tests")
class AdminServiceTest {

    @Mock private AdminRepository adminRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;
    @Mock private JwtService jwtService;
    @Mock private SessionService sessionService;

    @InjectMocks
    private AdminService adminService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(adminService, "rootAdminUsername", "rootadmin");
        ReflectionTestUtils.setField(adminService, "rootAdminPassword", "rootpass123");
    }

    private AdminRegisterRequest buildRegisterRequest(String username, String email,
                                                       String bankname, String password) {
        AdminRegisterRequest req = new AdminRegisterRequest();
        req.setUsername(username);
        req.setEmail(email);
        req.setBankname(bankname);
        req.setCountry("IN");
        req.setPassword(password);
        return req;
    }

    private Admin buildAdmin(Long id, String username, String email,
                              String bankname, ApplicationStatus status, boolean verified) {
        Admin admin = new Admin();
        admin.setId(id);
        admin.setUsername(username);
        admin.setEmail(email);
        admin.setBankname(bankname);
        admin.setCountry("IN");
        admin.setPassword("encodedPassword");
        admin.setVerifiedByRoot(verified);
        admin.setApplicationStatus(status);
        admin.setCreatedDate(LocalDateTime.now());
        return admin;
    }

    private void mockSecurityContext(String username) {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn(username);
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(ctx);
    }

    @Nested @DisplayName("register()")
    class Register {

        @Test @DisplayName("400 when username already exists")
        void usernameAlreadyExists() {
            when(adminRepository.findByUsername("admin1")).thenReturn(Optional.of(new Admin()));
            ResponseEntity<String> res = adminService.register(buildRegisterRequest("admin1","a@b.com","BankA","pass1234"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody()).contains("Username already exists");
            verify(adminRepository, never()).save(any());
        }

        @Test @DisplayName("400 when email already exists")
        void emailAlreadyExists() {
            when(adminRepository.findByUsername("admin1")).thenReturn(Optional.empty());
            when(adminRepository.findByEmail("a@b.com")).thenReturn(Optional.of(new Admin()));
            ResponseEntity<String> res = adminService.register(buildRegisterRequest("admin1","a@b.com","BankA","pass1234"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody()).contains("Email already exists");
            verify(adminRepository, never()).save(any());
        }

        @Test @DisplayName("400 when verified admin already exists for the bank")
        void verifiedAdminExistsForBank() {
            Admin existing = buildAdmin(1L,"other","o@b.com","BankA",ApplicationStatus.APPROVED,true);
            when(adminRepository.findByUsername("admin1")).thenReturn(Optional.empty());
            when(adminRepository.findByEmail("a@b.com")).thenReturn(Optional.empty());
            when(adminRepository.findByBankname("BankA")).thenReturn(List.of(existing));
            ResponseEntity<String> res = adminService.register(buildRegisterRequest("admin1","a@b.com","BankA","pass1234"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody()).contains("verified admin already exists");
            verify(adminRepository, never()).save(any());
        }

        @Test @DisplayName("200 saves admin and sends welcome email on success")
        void registerSuccess() {
            when(adminRepository.findByUsername("admin1")).thenReturn(Optional.empty());
            when(adminRepository.findByEmail("a@b.com")).thenReturn(Optional.empty());
            when(adminRepository.findByBankname("BankA")).thenReturn(Collections.emptyList());
            when(passwordEncoder.encode("pass1234")).thenReturn("encodedPass");
            ResponseEntity<String> res = adminService.register(buildRegisterRequest("admin1","a@b.com","BankA","pass1234"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(res.getBody()).contains("registered successfully");
            verify(adminRepository).save(any(Admin.class));
            verify(emailService).sendWelcomeNotification(eq("a@b.com"),eq("admin1"),eq("BankA"),anyString());
        }

        @Test @DisplayName("200 when bank has only unverified admins")
        void unverifiedBankAdminsAllowed() {
            Admin unverified = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.PENDING,false);
            when(adminRepository.findByUsername("admin2")).thenReturn(Optional.empty());
            when(adminRepository.findByEmail("b@b.com")).thenReturn(Optional.empty());
            when(adminRepository.findByBankname("BankA")).thenReturn(List.of(unverified));
            when(passwordEncoder.encode("pass1234")).thenReturn("encodedPass");
            ResponseEntity<String> res = adminService.register(buildRegisterRequest("admin2","b@b.com","BankA","pass1234"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(adminRepository).save(any(Admin.class));
        }
    }

    @Nested @DisplayName("login()")
    class Login {

        private AdminLoginRequest loginReq(String usernameOrEmail, String password) {
            AdminLoginRequest req = new AdminLoginRequest();
            req.setUsernameOrEmail(usernameOrEmail);
            req.setPassword(password);
            return req;
        }

        @Test @DisplayName("400 when admin not found")
        void adminNotFound() {
            when(adminRepository.findByUsername("ghost")).thenReturn(Optional.empty());
            when(adminRepository.findByEmail("ghost")).thenReturn(Optional.empty());
            ResponseEntity<AdminLoginResponse> res = adminService.login(loginReq("ghost","pass"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody().getMessage()).contains("Invalid credentials");
        }

        @Test @DisplayName("400 when password does not match")
        void wrongPassword() {
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.APPROVED,true);
            when(adminRepository.findByUsername("admin1")).thenReturn(Optional.of(admin));
            when(passwordEncoder.matches("wrong","encodedPassword")).thenReturn(false);
            ResponseEntity<AdminLoginResponse> res = adminService.login(loginReq("admin1","wrong"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody().getMessage()).contains("Invalid credentials");
        }

        @Test @DisplayName("400 when application is PENDING")
        void applicationPending() {
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.PENDING,false);
            when(adminRepository.findByUsername("admin1")).thenReturn(Optional.of(admin));
            when(passwordEncoder.matches("pass","encodedPassword")).thenReturn(true);
            ResponseEntity<AdminLoginResponse> res = adminService.login(loginReq("admin1","pass"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody().getMessage()).contains("pending");
        }

        @Test @DisplayName("400 when application is REJECTED")
        void applicationRejected() {
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.REJECTED,false);
            admin.setRejectionReason("Bad data");
            when(adminRepository.findByUsername("admin1")).thenReturn(Optional.of(admin));
            when(passwordEncoder.matches("pass","encodedPassword")).thenReturn(true);
            ResponseEntity<AdminLoginResponse> res = adminService.login(loginReq("admin1","pass"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody().getMessage()).contains("rejected");
        }

        @Test @DisplayName("200 returns JWT token on successful login")
        void loginSuccess() {
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.APPROVED,true);
            when(adminRepository.findByUsername("admin1")).thenReturn(Optional.of(admin));
            when(passwordEncoder.matches("pass1234","encodedPassword")).thenReturn(true);
            when(jwtService.generateToken("admin1",1L,"ADMIN")).thenReturn("jwt-token");
            when(jwtService.getExpirationTime()).thenReturn(3600000L);
            ResponseEntity<AdminLoginResponse> res = adminService.login(loginReq("admin1","pass1234"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(res.getBody().isSuccess()).isTrue();
            assertThat(res.getBody().getToken()).isEqualTo("jwt-token");
        }
    }

    @Nested @DisplayName("verifyAdmin()")
    class VerifyAdmin {

        @Test @DisplayName("403 when root credentials are wrong")
        void invalidRootCredentials() {
            ResponseEntity<String> res = adminService.verifyAdmin("admin1","wrongRoot","wrongPass");
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            assertThat(res.getBody()).contains("Invalid root admin credentials");
        }

        @Test @DisplayName("400 when target admin not found")
        void adminNotFound() {
            when(adminRepository.findByUsername("admin1")).thenReturn(Optional.empty());
            ResponseEntity<String> res = adminService.verifyAdmin("admin1","rootadmin","rootpass123");
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody()).contains("Admin not found");
        }

        @Test @DisplayName("200 sets verifiedByRoot=true, status=APPROVED, sends email")
        void verifySuccess() {
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.PENDING,false);
            when(adminRepository.findByUsername("admin1")).thenReturn(Optional.of(admin));
            ResponseEntity<String> res = adminService.verifyAdmin("admin1","rootadmin","rootpass123");
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(admin.isVerifiedByRoot()).isTrue();
            assertThat(admin.getApplicationStatus()).isEqualTo(ApplicationStatus.APPROVED);
            verify(adminRepository).save(admin);
            verify(emailService).sendAccountApprovalNotification("a@b.com","admin1","BankA");
        }
    }

    @Nested @DisplayName("updateAdminDetails()")
    class UpdateAdminDetails {

        @Test @DisplayName("400 when admin not found")
        void adminNotFound() {
            when(adminRepository.findById(99L)).thenReturn(Optional.empty());
            ResponseEntity<?> res = adminService.updateAdminDetails(99L, buildRegisterRequest("x","x@b.com","BankA","pass"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody()).isEqualTo("Admin not found.");
        }

        @Test @DisplayName("400 when new username is taken by another admin")
        void usernameTaken() {
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.APPROVED,true);
            Admin other = buildAdmin(2L,"admin2","b@b.com","BankA",ApplicationStatus.APPROVED,true);
            when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
            when(adminRepository.findByUsername("admin2")).thenReturn(Optional.of(other));
            ResponseEntity<?> res = adminService.updateAdminDetails(1L, buildRegisterRequest("admin2","a@b.com","BankA","pass"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody()).isEqualTo("Username already in use.");
        }

        @Test @DisplayName("400 when new email is taken by another admin")
        void emailTaken() {
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.APPROVED,true);
            Admin other = buildAdmin(2L,"admin2","b@b.com","BankA",ApplicationStatus.APPROVED,true);
            when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
            when(adminRepository.findByUsername("admin1")).thenReturn(Optional.of(admin));
            when(adminRepository.findByEmail("b@b.com")).thenReturn(Optional.of(other));
            ResponseEntity<?> res = adminService.updateAdminDetails(1L, buildRegisterRequest("admin1","b@b.com","BankA","pass"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody()).isEqualTo("Email already in use.");
        }

        @Test @DisplayName("200 updates all fields and saves")
        void updateSuccess() {
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.APPROVED,true);
            when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
            when(adminRepository.findByUsername("newAdmin")).thenReturn(Optional.empty());
            when(adminRepository.findByEmail("new@b.com")).thenReturn(Optional.empty());
            ResponseEntity<?> res = adminService.updateAdminDetails(1L, buildRegisterRequest("newAdmin","new@b.com","BankB","pass"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(admin.getUsername()).isEqualTo("newAdmin");
            assertThat(admin.getEmail()).isEqualTo("new@b.com");
            assertThat(admin.getBankname()).isEqualTo("BankB");
            verify(adminRepository).save(admin);
        }
    }

    @Nested @DisplayName("updateAdminPassword()")
    class UpdateAdminPassword {

        private ChangePasswordRequest pwdReq(String oldPwd, String newPwd) {
            return ChangePasswordRequest.builder().oldPassword(oldPwd).newPassword(newPwd).build();
        }

        @Test @DisplayName("400 when admin not found")
        void adminNotFound() {
            when(adminRepository.findById(1L)).thenReturn(Optional.empty());
            assertThat(adminService.updateAdminPassword(1L, pwdReq("old","new12345"))
                .getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        }

        @Test @DisplayName("400 when old password does not match")
        void wrongOldPassword() {
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.APPROVED,true);
            when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
            when(passwordEncoder.matches("wrongOld","encodedPassword")).thenReturn(false);
            ResponseEntity<?> res = adminService.updateAdminPassword(1L, pwdReq("wrongOld","newPass12"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody()).isEqualTo("Old password is incorrect.");
        }

        @Test @DisplayName("400 when new password is same as old password")
        void samePassword() {
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.APPROVED,true);
            when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
            when(passwordEncoder.matches("samePass","encodedPassword")).thenReturn(true);
            ResponseEntity<?> res = adminService.updateAdminPassword(1L, pwdReq("samePass","samePass"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody()).isEqualTo("New password must differ from old password.");
        }

        @Test @DisplayName("200 updates password and saves")
        void updatePasswordSuccess() {
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.APPROVED,true);
            when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
            when(passwordEncoder.matches("oldPass","encodedPassword")).thenReturn(true);
            when(passwordEncoder.matches("newPass12","encodedPassword")).thenReturn(false);
            when(passwordEncoder.encode("newPass12")).thenReturn("newEncodedPass");
            ResponseEntity<?> res = adminService.updateAdminPassword(1L, pwdReq("oldPass","newPass12"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(admin.getPassword()).isEqualTo("newEncodedPass");
            verify(adminRepository).save(admin);
        }
    }

    @Nested @DisplayName("getUnverifiedApplications()")
    class GetUnverifiedApplications {

        @Test @DisplayName("returns all pending admins")
        void returnsPendingList() {
            Admin a1 = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.PENDING,false);
            Admin a2 = buildAdmin(2L,"admin2","b@b.com","BankB",ApplicationStatus.PENDING,false);
            when(adminRepository.findByApplicationStatus(ApplicationStatus.PENDING)).thenReturn(List.of(a1,a2));
            ResponseEntity<List<Admin>> res = adminService.getUnverifiedApplications();
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(res.getBody()).hasSize(2);
        }

        @Test @DisplayName("returns empty list when no pending admins")
        void returnsEmptyList() {
            when(adminRepository.findByApplicationStatus(ApplicationStatus.PENDING)).thenReturn(Collections.emptyList());
            assertThat(adminService.getUnverifiedApplications().getBody()).isEmpty();
        }
    }

    @Nested @DisplayName("approveApplication()")
    class ApproveApplication {

        @Test @DisplayName("400 when admin not found")
        void adminNotFound() {
            mockSecurityContext("rootAdmin");
            when(adminRepository.findById(99L)).thenReturn(Optional.empty());
            ResponseEntity<String> res = adminService.approveApplication(99L, new ApplicationActionRequest());
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody()).contains("Admin not found");
        }

        @Test @DisplayName("400 when application is already APPROVED")
        void alreadyApproved() {
            mockSecurityContext("rootAdmin");
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.APPROVED,true);
            when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
            assertThat(adminService.approveApplication(1L, new ApplicationActionRequest())
                .getBody()).contains("already approved");
        }

        @Test @DisplayName("400 when application is REJECTED")
        void alreadyRejected() {
            mockSecurityContext("rootAdmin");
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.REJECTED,false);
            when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
            assertThat(adminService.approveApplication(1L, new ApplicationActionRequest())
                .getBody()).contains("Cannot approve a rejected");
        }

        @Test @DisplayName("400 when another admin for same bank is already approved")
        void anotherBankAdminApproved() {
            mockSecurityContext("rootAdmin");
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.PENDING,false);
            Admin other = buildAdmin(2L,"admin2","b@b.com","BankA",ApplicationStatus.APPROVED,true);
            when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
            when(adminRepository.findByBankname("BankA")).thenReturn(List.of(admin,other));
            assertThat(adminService.approveApplication(1L, new ApplicationActionRequest())
                .getBody()).contains("already verified");
        }

        @Test @DisplayName("200 approves and sends notification")
        void approveSuccess() {
            mockSecurityContext("rootAdmin");
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.PENDING,false);
            when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
            when(adminRepository.findByBankname("BankA")).thenReturn(List.of(admin));
            ResponseEntity<String> res = adminService.approveApplication(1L, new ApplicationActionRequest());
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(admin.getApplicationStatus()).isEqualTo(ApplicationStatus.APPROVED);
            assertThat(admin.isVerifiedByRoot()).isTrue();
            verify(adminRepository).save(admin);
            verify(emailService).sendAccountApprovalNotification("a@b.com","admin1","BankA");
        }
    }

    @Nested @DisplayName("rejectApplication()")
    class RejectApplication {

        @Test @DisplayName("400 when admin not found")
        void adminNotFound() {
            mockSecurityContext("rootAdmin");
            when(adminRepository.findById(99L)).thenReturn(Optional.empty());
            assertThat(adminService.rejectApplication(99L, new ApplicationActionRequest("reason"))
                .getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        }

        @Test @DisplayName("400 when application is already APPROVED")
        void alreadyApproved() {
            mockSecurityContext("rootAdmin");
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.APPROVED,true);
            when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
            assertThat(adminService.rejectApplication(1L, new ApplicationActionRequest("reason"))
                .getBody()).contains("Cannot reject an already approved");
        }

        @Test @DisplayName("400 when application is already REJECTED")
        void alreadyRejected() {
            mockSecurityContext("rootAdmin");
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.REJECTED,false);
            when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
            assertThat(adminService.rejectApplication(1L, new ApplicationActionRequest("reason"))
                .getBody()).contains("already rejected");
        }

        @Test @DisplayName("200 rejects, saves reason, sends notification")
        void rejectSuccess() {
            mockSecurityContext("rootAdmin");
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.PENDING,false);
            when(adminRepository.findById(1L)).thenReturn(Optional.of(admin));
            ResponseEntity<String> res = adminService.rejectApplication(1L, new ApplicationActionRequest("Bad data"));
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(admin.getApplicationStatus()).isEqualTo(ApplicationStatus.REJECTED);
            assertThat(admin.getRejectionReason()).isEqualTo("Bad data");
            verify(adminRepository).save(admin);
            verify(emailService).sendAccountRejectionNotification("a@b.com","admin1","BankA","Bad data");
        }
    }

    @Nested @DisplayName("checkApplicationStatus()")
    class CheckApplicationStatus {

        @Test @DisplayName("400 when admin not found")
        void adminNotFound() {
            when(adminRepository.findByUsername("ghost")).thenReturn(Optional.empty());
            when(adminRepository.findByEmail("ghost")).thenReturn(Optional.empty());
            assertThat(adminService.checkApplicationStatus("ghost")
                .getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        }

        @Test @DisplayName("returns status map for PENDING admin")
        void pendingAdmin() {
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.PENDING,false);
            when(adminRepository.findByUsername("admin1")).thenReturn(Optional.of(admin));
            ResponseEntity<?> res = adminService.checkApplicationStatus("admin1");
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
            @SuppressWarnings("unchecked")
            Map<String,Object> body = (Map<String,Object>) res.getBody();
            assertThat(body.get("applicationStatus")).isEqualTo("PENDING");
        }

        @Test @DisplayName("includes rejectionReason when REJECTED")
        void rejectedHasReason() {
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.REJECTED,false);
            admin.setRejectionReason("Fake documents");
            when(adminRepository.findByUsername("admin1")).thenReturn(Optional.of(admin));
            @SuppressWarnings("unchecked")
            Map<String,Object> body = (Map<String,Object>) adminService.checkApplicationStatus("admin1").getBody();
            assertThat(body).containsKey("rejectionReason");
            assertThat(body.get("rejectionReason")).isEqualTo("Fake documents");
        }

        @Test @DisplayName("does not include rejectionReason when APPROVED")
        void approvedHasNoRejectionReason() {
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.APPROVED,true);
            when(adminRepository.findByUsername("admin1")).thenReturn(Optional.of(admin));
            @SuppressWarnings("unchecked")
            Map<String,Object> body = (Map<String,Object>) adminService.checkApplicationStatus("admin1").getBody();
            assertThat(body).doesNotContainKey("rejectionReason");
        }
    }

    @Nested @DisplayName("getAdminEmailsByBankName()")
    class GetAdminEmailsByBankName {

        @Test @DisplayName("400 when no admins found for the bank")
        void noAdminsForBank() {
            when(adminRepository.findByBankname("UnknownBank")).thenReturn(Collections.emptyList());
            assertThat(adminService.getAdminEmailsByBankName("UnknownBank")
                .getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        }

        @Test @DisplayName("400 when no verified admins exist for the bank")
        void noVerifiedAdmins() {
            Admin unverified = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.PENDING,false);
            when(adminRepository.findByBankname("BankA")).thenReturn(List.of(unverified));
            ResponseEntity<?> res = adminService.getAdminEmailsByBankName("BankA");
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody()).isEqualTo("No verified admins found for bank: BankA");
        }

        @Test @DisplayName("200 returns only verified admin emails")
        void returnsVerifiedEmails() {
            Admin verified = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.APPROVED,true);
            Admin unverified = buildAdmin(2L,"admin2","b@b.com","BankA",ApplicationStatus.PENDING,false);
            when(adminRepository.findByBankname("BankA")).thenReturn(List.of(verified,unverified));
            ResponseEntity<?> res = adminService.getAdminEmailsByBankName("BankA");
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
            @SuppressWarnings("unchecked")
            Map<String,Object> body = (Map<String,Object>) res.getBody();
            @SuppressWarnings("unchecked")
            List<String> emails = (List<String>) body.get("adminEmails");
            assertThat(emails).containsExactly("a@b.com");
            assertThat(body.get("count")).isEqualTo(1);
        }
    }

    @Nested @DisplayName("logout()")
    class Logout {

        @Test @DisplayName("400 when token is invalid")
        void invalidToken() {
            when(jwtService.isTokenValid("bad-token")).thenReturn(false);
            ResponseEntity<String> res = adminService.logout("Bearer bad-token");
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody()).contains("Invalid token");
            verify(sessionService, never()).blacklistToken(any());
        }

        @Test @DisplayName("200 blacklists token after stripping Bearer prefix")
        void logoutSuccessWithBearer() {
            when(jwtService.isTokenValid("valid-token")).thenReturn(true);
            assertThat(adminService.logout("Bearer valid-token").getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(sessionService).blacklistToken("valid-token");
        }

        @Test @DisplayName("200 blacklists token without Bearer prefix")
        void logoutSuccessWithoutBearer() {
            when(jwtService.isTokenValid("raw-token")).thenReturn(true);
            assertThat(adminService.logout("raw-token").getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(sessionService).blacklistToken("raw-token");
        }
    }

    @Nested @DisplayName("getCurrentAdminDetails()")
    class GetCurrentAdminDetails {

        @Test @DisplayName("400 when authenticated admin not found in DB")
        void adminNotFound() {
            mockSecurityContext("admin1");
            when(adminRepository.findByUsername("admin1")).thenReturn(Optional.empty());
            ResponseEntity<?> res = adminService.getCurrentAdminDetails();
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(res.getBody()).isEqualTo("Admin not found.");
        }

        @Test @DisplayName("200 returns correct AdminDto")
        void returnsAdminDto() {
            mockSecurityContext("admin1");
            Admin admin = buildAdmin(1L,"admin1","a@b.com","BankA",ApplicationStatus.APPROVED,true);
            when(adminRepository.findByUsername("admin1")).thenReturn(Optional.of(admin));
            ResponseEntity<?> res = adminService.getCurrentAdminDetails();
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
            AdminLoginResponse.AdminDto dto = (AdminLoginResponse.AdminDto) res.getBody();
            assertThat(dto.getUsername()).isEqualTo("admin1");
            assertThat(dto.getEmail()).isEqualTo("a@b.com");
            assertThat(dto.isVerifiedByRoot()).isTrue();
        }
    }
}