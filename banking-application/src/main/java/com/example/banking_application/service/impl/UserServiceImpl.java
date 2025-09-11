package com.example.banking_application.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.banking_application.dto.UserDto;
import com.example.banking_application.entity.User;
import com.example.banking_application.mapper.UserMapper;
import com.example.banking_application.repository.UserRepository;
import com.example.banking_application.service.UserService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;



@Service
public class UserServiceImpl implements UserService{

    @Autowired
    private UserRepository userRepository;
    
    @Override
    public UserDto createUser(UserDto userDto) {
    User user = UserMapper.mapToUser(userDto);
    BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    String hashedPassword = passwordEncoder.encode(user.getPassword());
    user.setPassword(hashedPassword);
    User savedUser = userRepository.save(user);
    return UserMapper.mapToUserDto(savedUser);
    }

    @Override
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id).orElse(null);
        return UserMapper.mapToUserDto(user);
    }

    @Override
    public List<UserDto> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream().map((user) -> UserMapper.mapToUserDto(user))
                .toList();
    }

    @Override
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = UserMapper.mapToUser(userDto);
        user.setId(id);
        User updatedUser = userRepository.save(user);
        return UserMapper.mapToUserDto(updatedUser);
    }

    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user != null) {
            userRepository.delete(user);
        }
    }
}
