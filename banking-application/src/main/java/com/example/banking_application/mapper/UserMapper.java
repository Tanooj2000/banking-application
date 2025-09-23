package com.example.banking_application.mapper;

import com.example.banking_application.dto.UserDto;
import com.example.banking_application.entity.User;

public class UserMapper {
    public static User mapToUser(UserDto userDto){
        User user = new User(
            userDto.getId(),
            userDto.getName(),
            userDto.getEmail(),
            userDto.getPhone(),
            userDto.getPassword()
        );
        return user;
    }
    public static UserDto mapToUserDto(User user){
        UserDto userDto = new UserDto(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getPhone(),
            user.getPassword()
        );
        return userDto;
    }
}
