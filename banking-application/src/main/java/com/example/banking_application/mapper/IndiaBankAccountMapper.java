package com.example.banking_application.mapper;

import com.example.banking_application.dto.IndiaBankAccountDto;
import com.example.banking_application.entity.IndiaBankAccount;

public class IndiaBankAccountMapper {
    public static IndiaBankAccountDto toDto(IndiaBankAccount entity) {
        IndiaBankAccountDto dto = new IndiaBankAccountDto();
        dto.setId(entity.getId());
        dto.setFullName(entity.getFullName());
        dto.setAadhaar(entity.getAadhaar());
        dto.setPan(entity.getPan());
        dto.setMobile(entity.getMobile());
        dto.setEmail(entity.getEmail());
        dto.setDob(entity.getDob());
        dto.setGender(entity.getGender());
        dto.setOccupation(entity.getOccupation());
        dto.setAddress(entity.getAddress());
        dto.setIdProofType(entity.getIdProofType());
        dto.setDeposit(entity.getDeposit());
        dto.setConsent(entity.getConsent());
        dto.setBank(entity.getBank());
        dto.setCountry(entity.getCountry());
        dto.setStatus(entity.getStatus());
        return dto;
    }

    public static IndiaBankAccount toEntity(IndiaBankAccountDto dto) {
        IndiaBankAccount entity = new IndiaBankAccount();
        entity.setId(dto.getId());
        entity.setFullName(dto.getFullName());
        entity.setAadhaar(dto.getAadhaar());
        entity.setPan(dto.getPan());
        entity.setMobile(dto.getMobile());
        entity.setEmail(dto.getEmail());
        entity.setDob(dto.getDob());
        entity.setGender(dto.getGender());
        entity.setOccupation(dto.getOccupation());
        entity.setAddress(dto.getAddress());
        entity.setIdProofType(dto.getIdProofType());
        entity.setDeposit(dto.getDeposit());
        entity.setConsent(dto.getConsent());
        entity.setBank(dto.getBank());
        entity.setCountry(dto.getCountry());
        entity.setStatus(dto.getStatus());
        return entity;
    }
}
