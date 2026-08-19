package com.example.user_service.service;

import com.example.user_service.dto.AllUsersResponse;
import com.example.user_service.dto.ChangePasswordRequest;
import com.example.user_service.dto.LoginRequest;
import com.example.user_service.dto.LoginResponse;
import com.example.user_service.dto.RegisterRequest;
import com.example.user_service.dto.UpdateUserRequest;
import com.example.user_service.dto.UpdateUserResponse;
import com.example.user_service.dto.UserDetailsResponse;
import com.example.user_service.entity.User;
import com.example.user_service.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private SessionService sessionService;
    @Mock private EmailService emailService;

    @InjectMocks
    private UserService userService;

    private RegisterRequest registerRequest(String username, String email, long phonenumber, String password) {
        RegisterRequest request = new RegisterRequest();
        request.setUsername(username);
        request.setEmail(email);
        request.setPhonenumber(phonenumber);
        request.setPassword(password);
        return request;
    }

    private User buildUser(Long id, String username, String email, long phonenumber, String password) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(email);
        user.setPhonenumber(phonenumber);
        user.setPassword(password);
        return user;
    }

    @Nested @DisplayName("register()")
    class Register {

        @Test @DisplayName("400 when username already exists")
        void usernameExists() {
            when(userRepository.findByUsername("user1")).thenReturn(Optional.of(new User()));

            ResponseEntity<String> response = userService.register(registerRequest("user1", "u@b.com", 9876543210L, "pass1234"));

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isEqualTo("Username already taken.");
            verify(userRepository, never()).save(any());
        }

        @Test @DisplayName("400 when email already exists")
        void emailExists() {
            when(userRepository.findByUsername("user1")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("u@b.com")).thenReturn(Optional.of(new User()));

            ResponseEntity<String> response = userService.register(registerRequest("user1", "u@b.com", 9876543210L, "pass1234"));

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isEqualTo("Email already existed.");
            verify(userRepository, never()).save(any());
        }

        @Test @DisplayName("400 when phone number already exists")
        void phoneExists() {
            when(userRepository.findByUsername("user1")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("u@b.com")).thenReturn(Optional.empty());
            when(userRepository.findByPhonenumber(9876543210L)).thenReturn(Optional.of(new User()));

            ResponseEntity<String> response = userService.register(registerRequest("user1", "u@b.com", 9876543210L, "pass1234"));

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isEqualTo("Phone number already existed.");
            verify(userRepository, never()).save(any());
        }

        @Test @DisplayName("200 saves user and sends welcome email")
        void registerSuccess() {
            when(userRepository.findByUsername("user1")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("u@b.com")).thenReturn(Optional.empty());
            when(userRepository.findByPhonenumber(9876543210L)).thenReturn(Optional.empty());
            when(passwordEncoder.encode("pass1234")).thenReturn("encoded-pass");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ResponseEntity<String> response = userService.register(registerRequest("user1", "u@b.com", 9876543210L, "pass1234"));

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).contains("Registration successful");
            verify(userRepository).save(any(User.class));
            verify(emailService).sendWelcomeEmail("u@b.com", "user1");
        }
    }

    @Nested @DisplayName("login()")
    class Login {

        @Test @DisplayName("400 when user not found")
        void userNotFound() {
            LoginRequest request = new LoginRequest();
            request.setUsernameOrEmail("ghost");
            request.setPassword("pass1234");

            when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("ghost")).thenReturn(Optional.empty());

            ResponseEntity<LoginResponse> response = userService.login(request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody().isSuccess()).isFalse();
        }

        @Test @DisplayName("400 when password does not match")
        void wrongPassword() {
            User user = buildUser(1L, "user1", "u@b.com", 9876543210L, "encoded-pass");
            LoginRequest request = new LoginRequest();
            request.setUsernameOrEmail("user1");
            request.setPassword("wrong");

            when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrong", "encoded-pass")).thenReturn(false);

            ResponseEntity<LoginResponse> response = userService.login(request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody().getMessage()).contains("Invalid Password");
        }

        @Test @DisplayName("200 returns JWT token on successful login")
        void loginSuccess() {
            User user = buildUser(1L, "user1", "u@b.com", 9876543210L, "encoded-pass");
            LoginRequest request = new LoginRequest();
            request.setUsernameOrEmail("user1");
            request.setPassword("pass1234");

            when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("pass1234", "encoded-pass")).thenReturn(true);
            when(jwtService.generateToken("user1", 1L)).thenReturn("jwt-token");
            when(jwtService.getExpirationTime()).thenReturn(3600000L);

            ResponseEntity<LoginResponse> response = userService.login(request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody().isSuccess()).isTrue();
            assertThat(response.getBody().getToken()).isEqualTo("jwt-token");
        }
    }

    @Nested @DisplayName("updateUserDetails()")
    class UpdateUserDetails {

        @Test @DisplayName("400 when user not found")
        void userNotFound() {
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            ResponseEntity<UpdateUserResponse> response = userService.updateUserDetails(99L, new UpdateUserRequest());

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody().isSuccess()).isFalse();
        }

        @Test @DisplayName("400 when username already in use")
        void usernameTaken() {
            User user = buildUser(1L, "user1", "u@b.com", 9876543210L, "encoded-pass");
            UpdateUserRequest request = new UpdateUserRequest();
            request.setUsername("user2");

            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(userRepository.findByUsername("user2")).thenReturn(Optional.of(buildUser(2L, "user2", "other@b.com", 1111111111L, "x")));

            ResponseEntity<UpdateUserResponse> response = userService.updateUserDetails(1L, request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody().getMessage()).contains("username is already in use");
            verify(userRepository, never()).save(any());
        }

        @Test @DisplayName("200 updates user details and saves")
        void updateSuccess() {
            User user = buildUser(1L, "user1", "u@b.com", 9876543210L, "encoded-pass");
            UpdateUserRequest request = new UpdateUserRequest();
            request.setUsername("user2");
            request.setEmail("new@b.com");
            request.setPhonenumber(9999999999L);

            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(userRepository.findByUsername("user2")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("new@b.com")).thenReturn(Optional.empty());
            when(userRepository.findByPhonenumber(9999999999L)).thenReturn(Optional.empty());
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ResponseEntity<UpdateUserResponse> response = userService.updateUserDetails(1L, request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody().isSuccess()).isTrue();
            assertThat(response.getBody().getUser().getUsername()).isEqualTo("user2");
            verify(userRepository).save(user);
        }
    }

    @Nested @DisplayName("changePassword()")
    class ChangePassword {

        @Test @DisplayName("400 when user not found")
        void userNotFound() {
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            ResponseEntity<UpdateUserResponse> response = userService.changePassword(1L, passwordRequest("old", "newPass12"));

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        }

        @Test @DisplayName("400 when current password is incorrect")
        void wrongCurrentPassword() {
            User user = buildUser(1L, "user1", "u@b.com", 9876543210L, "encoded-pass");
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrong", "encoded-pass")).thenReturn(false);

            ResponseEntity<UpdateUserResponse> response = userService.changePassword(1L, passwordRequest("wrong", "newPass12"));

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody().getMessage()).contains("Current password is incorrect");
        }

        @Test @DisplayName("200 updates password and saves")
        void changePasswordSuccess() {
            User user = buildUser(1L, "user1", "u@b.com", 9876543210L, "encoded-pass");
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("oldPass", "encoded-pass")).thenReturn(true);
            when(passwordEncoder.matches("newPass12", "encoded-pass")).thenReturn(false);
            when(passwordEncoder.encode("newPass12")).thenReturn("new-encoded");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ResponseEntity<UpdateUserResponse> response = userService.changePassword(1L, passwordRequest("oldPass", "newPass12"));

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(user.getPassword()).isEqualTo("new-encoded");
            verify(userRepository).save(user);
        }
    }

    @Nested @DisplayName("getUserById()")
    class GetUserById {

        @Test @DisplayName("400 when user not found")
        void userNotFound() {
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            ResponseEntity<UserDetailsResponse> response = userService.getUserById(1L);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody().isSuccess()).isFalse();
        }

        @Test @DisplayName("200 returns user details")
        void getUserByIdSuccess() {
            User user = buildUser(1L, "user1", "u@b.com", 9876543210L, "encoded-pass");
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));

            ResponseEntity<UserDetailsResponse> response = userService.getUserById(1L);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody().getUser().getUsername()).isEqualTo("user1");
        }
    }

    @Nested @DisplayName("getAllUsers()")
    class GetAllUsers {

        @Test @DisplayName("200 returns all users")
        void getAllUsersSuccess() {
            when(userRepository.findAll()).thenReturn(List.of(buildUser(1L, "user1", "u@b.com", 9876543210L, "encoded-pass")));

            ResponseEntity<AllUsersResponse> response = userService.getAllUsers();

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody().getUsers()).hasSize(1);
        }
    }

    @Nested @DisplayName("logout()")
    class Logout {

        @Test @DisplayName("200 blacklists bearer token")
        void logoutSuccess() {
            ResponseEntity<String> response = userService.logout("Bearer valid-token");

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEqualTo("Logout successful");
            verify(sessionService).blacklistToken("valid-token");
        }
    }

    @Nested @DisplayName("getCurrentUser()")
    class GetCurrentUser {

        @Test @DisplayName("400 when token is invalid")
        void invalidToken() {
            when(jwtService.extractUserId("valid-token")).thenReturn(null);

            ResponseEntity<UserDetailsResponse> response = userService.getCurrentUser("Bearer valid-token");

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody().isSuccess()).isFalse();
        }

        @Test @DisplayName("200 returns current user details")
        void getCurrentUserSuccess() {
            User user = buildUser(1L, "user1", "u@b.com", 9876543210L, "encoded-pass");
            when(jwtService.extractUserId("valid-token")).thenReturn(1L);
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));

            ResponseEntity<UserDetailsResponse> response = userService.getCurrentUser("Bearer valid-token");

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody().getUser().getEmail()).isEqualTo("u@b.com");
        }
    }

    private ChangePasswordRequest passwordRequest(String currentPassword, String newPassword) {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword(currentPassword);
        request.setNewPassword(newPassword);
        return request;
    }
}