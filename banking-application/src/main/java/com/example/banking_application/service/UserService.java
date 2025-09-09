package com.example.banking_application.service;

import java.util.List;

import com.example.banking_application.dto.UserDto;

public interface UserService {

    public UserDto createUser(UserDto userDto);

    public UserDto getUserById(Long id);

    public List<UserDto> getAllUsers();

    public UserDto updateUser(Long id, UserDto userDto);
    
    public void deleteUser(Long id);
}
