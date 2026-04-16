package com.example.account_service.dto;

import org.springframework.core.io.Resource;

public class DocumentDownloadResponse {
    private String originalFilename;
    private String contentType;
    private Long fileSize;
    private Resource resource;
    
    public DocumentDownloadResponse() {}
    
    public DocumentDownloadResponse(String originalFilename, String contentType, Long fileSize, Resource resource) {
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.resource = resource;
    }
    
    public String getOriginalFilename() {
        return originalFilename;
    }
    
    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }
    
    public String getContentType() {
        return contentType;
    }
    
    public void setContentType(String contentType) {
        this.contentType = contentType;
    }
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
    
    public Resource getResource() {
        return resource;
    }
    
    public void setResource(Resource resource) {
        this.resource = resource;
    }
}