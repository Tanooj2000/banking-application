package com.example.banking_application.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Service;

import com.example.banking_application.dto.AdminDto;
import com.example.banking_application.entity.Admin;
import com.example.banking_application.mapper.AdminMapper;
import com.example.banking_application.repository.AdminRepository;
import com.example.banking_application.service.AdminService;

@Service
public class AdminServiceImpl implements AdminService{
    @Autowired
    private AdminRepository adminRepository;
    
    @Override
    public AdminDto createAdmin(AdminDto adminDto) {
        Admin admin = AdminMapper.mapToAdmin(adminDto);
        admin = adminRepository.save(admin);
        return AdminMapper.mapToAdminDto(admin);
    }

    @Override
    public AdminDto getAdminById(Long id) {
        Admin admin = adminRepository.findById(id).orElse(null);
        return AdminMapper.mapToAdminDto(admin);
    }

    @Override
    public List<AdminDto> getAllAdmins() {
        List<Admin> admins = adminRepository.findAll();
        return admins.stream().map(AdminMapper::mapToAdminDto).toList();
    }

    @Override
    public AdminDto updateAdmin(Long id, AdminDto adminDto) {
        Admin admin = AdminMapper.mapToAdmin(adminDto);
        admin.setId(id);
        Admin updatedAdmin = adminRepository.save(admin);
        return AdminMapper.mapToAdminDto(updatedAdmin);
    }

    @Override
    public void deleteAdmin(Long id) {
        Admin admin = adminRepository.findById(id).orElse(null);
        if (admin != null) {
            adminRepository.delete(admin);
        }
    }
    
}
