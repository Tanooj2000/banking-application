package com.example.banking_application.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.banking_application.dto.AdminDto;
import com.example.banking_application.service.AdminService;

@RestController
@RequestMapping("/api/admins")
public class AdminController {
    @Autowired
    private AdminService adminService;

    @PostMapping
    public ResponseEntity<AdminDto> addAdmin(@RequestBody AdminDto adminDto){
        return new ResponseEntity<>(adminService.createAdmin(adminDto),HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<AdminDto> getAdminById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getAdminById(id));
    }

    @GetMapping("/alladmins")
    public ResponseEntity<List<AdminDto>> getAllAdmins() {
        return ResponseEntity.ok(adminService.getAllAdmins());
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminDto> updateAdmin(@PathVariable Long id, @RequestBody AdminDto adminDto) {
        return ResponseEntity.ok(adminService.updateAdmin(id, adminDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> removeAdmin(@PathVariable long id){
        adminService.deleteAdmin(id);
        return ResponseEntity.ok("Admin deleted successfully");
    }
}
