package com.example.banking_application.service;

import java.util.List;
import com.example.banking_application.dto.AdminDto;

public interface AdminService {

    public AdminDto createAdmin(AdminDto adminDto);

    public AdminDto getAdminById(Long id);

    public List<AdminDto> getAllAdmins();

    public AdminDto updateAdmin(Long id, AdminDto adminDto);

    public void deleteAdmin(Long id);

    public void login(String email, String password);
    
} 
