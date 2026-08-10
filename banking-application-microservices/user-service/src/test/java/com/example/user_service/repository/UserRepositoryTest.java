package com.example.user_service.repository;

import com.example.user_service.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@DisplayName("UserRepository Tests")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    private User buildUser() {
        return new User(null, "user1", "u@b.com", 9876543210L, "encoded-pass");
    }

    @Test
    @DisplayName("findByUsername returns a matching user")
    void findByUsernameReturnsMatchingUser() {
        User user = buildUser();
        userRepository.save(user);

        assertThat(userRepository.findByUsername("user1")).isPresent();
    }

    @Test
    @DisplayName("findByEmail returns a matching user")
    void findByEmailReturnsMatchingUser() {
        User user = buildUser();
        userRepository.save(user);

        assertThat(userRepository.findByEmail("u@b.com")).isPresent();
    }

    @Test
    @DisplayName("findByPhonenumber returns a matching user")
    void findByPhonenumberReturnsMatchingUser() {
        User user = buildUser();
        userRepository.save(user);

        assertThat(userRepository.findByPhonenumber(9876543210L)).isPresent();
    }

    @Test
    @DisplayName("save persists a new user")
    void savePersistsNewUser() {
        User user = buildUser();

        User savedUser = userRepository.save(user);

        assertThat(savedUser.getId()).isNotNull();
        assertThat(userRepository.findById(savedUser.getId())).isPresent();
    }
}