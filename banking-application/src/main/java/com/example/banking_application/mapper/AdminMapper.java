package com.example.banking_application.mapper;

import com.example.banking_application.dto.AdminDto;
import com.example.banking_application.entity.Admin;

public class AdminMapper {
    public static AdminDto mapToAdminDto(Admin admin) {
        if (admin == null) {
            return null;
        }
        AdminDto dto = new AdminDto();
        dto.setId(admin.getId());
        dto.setName(admin.getName());
        dto.setEmail(admin.getEmail());
        dto.setBankName(admin.getBankName());
        return dto;
    }

    public static Admin mapToAdmin(AdminDto dto) {
        if (dto == null) {
            return null;
        }
        Admin admin = new Admin();
        admin.setId(dto.getId());
        admin.setName(dto.getName());
        admin.setEmail(dto.getEmail());
        admin.setBankName(dto.getBankName());
        // Note: Password is not set from DTO for security reasons
        return admin;
    }
}
