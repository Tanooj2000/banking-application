package com.example.user_service.controller;

import com.example.user_service.config.JwtAuthenticationFilter;
import com.example.user_service.dto.AllUsersResponse;
import com.example.user_service.dto.ChangePasswordRequest;
import com.example.user_service.dto.LoginRequest;
import com.example.user_service.dto.LoginResponse;
import com.example.user_service.dto.RegisterRequest;
import com.example.user_service.dto.UpdateUserRequest;
import com.example.user_service.dto.UpdateUserResponse;
import com.example.user_service.dto.UserDetailsResponse;
import com.example.user_service.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.hamcrest.Matchers;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = UserController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = JwtAuthenticationFilter.class
    )
)
@DisplayName("UserController Tests")
class UserControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private UserService userService;

    private RegisterRequest registerRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("user1");
        request.setEmail("u@b.com");
        request.setPhonenumber(9876543210L);
        request.setPassword("pass1234");
        return request;
    }

    private UserDetailsResponse.UserDto userDto() {
        return new UserDetailsResponse.UserDto(1L, "user1", "u@b.com", 9876543210L);
    }

    // =========================================================================
    // POST /api/user/register
    // =========================================================================

    @Nested @DisplayName("POST /api/user/register")
    class Register {

        @Test @DisplayName("200 when registration succeeds")
        @WithMockUser
        void registerSuccess() throws Exception {
            when(userService.register(any())).thenReturn(ResponseEntity.ok("Registration successful. You can now login with your username or email."));

            mockMvc.perform(post("/api/user/register")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registerRequest())))
                .andExpect(status().isOk())
                .andExpect(content().string("Registration successful. You can now login with your username or email."));
        }

        @Test @DisplayName("400 when username already exists")
        @WithMockUser
        void registerConflict() throws Exception {
            when(userService.register(any())).thenReturn(ResponseEntity.badRequest().body("Username already taken."));

            mockMvc.perform(post("/api/user/register")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registerRequest())))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Username already taken."));
        }
    }

    // =========================================================================
    // POST /api/user/login
    // =========================================================================

    @Nested @DisplayName("POST /api/user/login")
    class Login {

        @Test @DisplayName("200 and returns token on successful login")
        @WithMockUser
        void loginSuccess() throws Exception {
            LoginResponse.UserDto dto = new LoginResponse.UserDto(1L, "user1", "u@b.com", 9876543210L);
            LoginResponse response = new LoginResponse(true, "Login successful.", "jwt-token", 3600000L, dto);
            when(userService.login(any())).thenReturn(ResponseEntity.ok(response));

            LoginRequest request = new LoginRequest();
            request.setUsernameOrEmail("user1");
            request.setPassword("pass1234");

            mockMvc.perform(post("/api/user/login")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.token").value("jwt-token"));
        }

        @Test @DisplayName("400 when credentials are invalid")
        @WithMockUser
        void loginFails() throws Exception {
            LoginResponse response = new LoginResponse(false, "Invalid username/email or password.", null, null, null);
            when(userService.login(any())).thenReturn(ResponseEntity.badRequest().body(response));

            LoginRequest request = new LoginRequest();
            request.setUsernameOrEmail("user1");
            request.setPassword("wrong");

            mockMvc.perform(post("/api/user/login")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
        }
    }

    // =========================================================================
    // POST /api/user/logout
    // =========================================================================

    @Nested @DisplayName("POST /api/user/logout")
    class Logout {

        @Test @DisplayName("200 on successful logout")
        @WithMockUser
        void logoutSuccess() throws Exception {
            when(userService.logout(anyString())).thenReturn(ResponseEntity.ok("Logout successful"));

            mockMvc.perform(post("/api/user/logout")
                    .with(csrf())
                    .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(content().string("Logout successful"));
        }
    }

    // =========================================================================
    // GET /api/user/{id}
    // =========================================================================

    @Nested @DisplayName("GET /api/user/{id}")
    class GetUserById {

        @Test @DisplayName("200 returns user details")
        @WithMockUser
        void getUserByIdSuccess() throws Exception {
            doReturn(ResponseEntity.ok(new UserDetailsResponse(true, "User details retrieved successfully", userDto())))
                .when(userService).getUserById(1L);

            mockMvc.perform(get("/api/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username").value("user1"))
                .andExpect(jsonPath("$.user.email").value("u@b.com"));
        }
    }

    // =========================================================================
    // GET /api/user
    // =========================================================================

    @Nested @DisplayName("GET /api/user")
    class GetAllUsers {

        @Test @DisplayName("200 returns list of users")
        @WithMockUser
        void getAllUsersSuccess() throws Exception {
            AllUsersResponse response = new AllUsersResponse(true, "All users retrieved successfully", List.of(userDto()));
            doReturn(ResponseEntity.ok(response)).when(userService).getAllUsers();

            mockMvc.perform(get("/api/user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users[0].username").value("user1"));
        }
    }

    // =========================================================================
    // PUT /api/user/{id}
    // =========================================================================

    @Nested @DisplayName("PUT /api/user/{id}")
    class UpdateUserDetails {

        @Test @DisplayName("200 when update succeeds")
        @WithMockUser
        void updateSuccess() throws Exception {
            UpdateUserResponse.UserDto dto = new UpdateUserResponse.UserDto(1L, "user1", "new@b.com", 9876543210L);
            doReturn(ResponseEntity.ok(new UpdateUserResponse(true, "User details updated successfully", dto)))
                .when(userService).updateUserDetails(eq(1L), any());

            UpdateUserRequest request = new UpdateUserRequest();
            request.setUsername("user1");
            request.setEmail("new@b.com");
            request.setPhonenumber(9876543210L);

            mockMvc.perform(put("/api/user/1")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string(Matchers.containsString("User details updated successfully")));
        }
    }

    // =========================================================================
    // PUT /api/user/{id}/password
    // =========================================================================

    @Nested @DisplayName("PUT /api/user/{id}/password")
    class ChangePassword {

        @Test @DisplayName("200 when password change succeeds")
        @WithMockUser
        void changePasswordSuccess() throws Exception {
            UpdateUserResponse.UserDto dto = new UpdateUserResponse.UserDto(1L, "user1", "u@b.com", 9876543210L);
            doReturn(ResponseEntity.ok(new UpdateUserResponse(true, "Password changed successfully", dto)))
                .when(userService).changePassword(eq(1L), any());

            ChangePasswordRequest request = new ChangePasswordRequest();
            request.setCurrentPassword("oldPass1");
            request.setNewPassword("newPass12");

            mockMvc.perform(put("/api/user/1/password")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string(Matchers.containsString("Password changed successfully")));
        }
    }

    // =========================================================================
    // GET /api/user/me
    // =========================================================================

    @Nested @DisplayName("GET /api/user/me")
    class GetCurrentUser {

        @Test @DisplayName("200 returns current user details")
        @WithMockUser
        void getCurrentUserSuccess() throws Exception {
            doReturn(ResponseEntity.ok(new UserDetailsResponse(true, "User details retrieved", userDto())))
                .when(userService).getCurrentUser("Bearer valid-token");

            mockMvc.perform(get("/api/user/me").header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username").value("user1"))
                .andExpect(jsonPath("$.user.email").value("u@b.com"));
        }
    }
}