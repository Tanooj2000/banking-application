package com.example.account_service.client;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.account_service.dto.AdminEmailResponse;


@FeignClient(name="ADMIN-SERVICE")
public interface AdminClient {
    @GetMapping("/api/admin/emails/by-bank")
    AdminEmailResponse getAdminEmailResponse(@RequestParam String bankName);
        
}
