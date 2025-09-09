package com.example.banking_application.mapper;

import com.example.banking_application.dto.AdminDto;
import com.example.banking_application.entity.Admin;

public class AdminMapper {
    public static Admin mapToAdmin(AdminDto adminDto){
        Admin admin = new Admin(
            adminDto.getId(),
            adminDto.getName(),
            adminDto.getEmail(),
            adminDto.getPassword()
        );
        return admin;
    }

    public static AdminDto mapToAdminDto(Admin admin){
        AdminDto adminDto = new AdminDto();
        adminDto.setId(admin.getId());
        adminDto.setName(admin.getName());
        adminDto.setEmail(admin.getEmail());
        adminDto.setPassword(admin.getPassword());
        return adminDto;
    }
}
