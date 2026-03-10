package com.example.account_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.example.account_service.dto.AdminEmailResponse;

import java.util.List;

@Service
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    @Autowired
    private WebClient webClient;

    @Value("${admin.service.url}")
    private String adminServiceUrl;

    /**
     * Fetches admin emails for a specific bank from the admin microservice
     * @param bankName The name of the bank
     * @return List of admin email addresses
     */
    public List<String> getAdminEmailsByBank(String bankName) {
        try {
            String url = adminServiceUrl + "/api/admin/emails/by-bank?bankName=" + bankName;
            
            logger.info("Fetching admin email for bank: {} from URL: {}", bankName, url);
            
            AdminEmailResponse response = webClient
                .get()
                .uri(url)
                .retrieve()
                .bodyToMono(AdminEmailResponse.class)
                .block();

            if (response != null && response.getAdminEmails() != null && !response.getAdminEmails().isEmpty()) {
                logger.info("Successfully fetched {} admin email(s) for bank: {}", response.getCount(), bankName);
                return response.getAdminEmails();
            } else {
                logger.warn("No admin emails found for bank: {}", bankName);
                return List.of();
            }
            
        } catch (Exception e) {
            logger.error("Failed to fetch admin email for bank: {}. Error: {}", bankName, e.getMessage());
            return List.of();
        }
    }

    /**
     * Fetches a single admin email for a specific bank (returns the first one if multiple exist)
     * @param bankName The name of the bank
     * @return Admin email address or null if not found
     */
    public String getFirstAdminEmailByBank(String bankName) {
        List<String> adminEmails = getAdminEmailsByBank(bankName);
        return adminEmails.isEmpty() ? null : adminEmails.get(0);
    }
}