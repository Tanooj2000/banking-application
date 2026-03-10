package com.example.account_service.dto;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public class AdminEmailResponse {
    
    @JsonProperty("adminEmails")
    private List<String> adminEmails;
    
    @JsonProperty("count")
    private int count;
    
    @JsonProperty("bankName")
    private String bankName;

    public List<String> getAdminEmails() {
        return adminEmails;
    }

    public void setAdminEmails(List<String> adminEmails) {
        this.adminEmails = adminEmails;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }
}