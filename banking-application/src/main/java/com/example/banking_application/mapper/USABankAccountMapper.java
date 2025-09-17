package com.example.banking_application.mapper;

import com.example.banking_application.dto.USABankAccountDto;
import com.example.banking_application.entity.USABankAccount;

public class USABankAccountMapper {
    public static USABankAccountDto toDto(USABankAccount entity) {
        USABankAccountDto dto = new USABankAccountDto();
        dto.setId(entity.getId());
        dto.setFullName(entity.getFullName());
        dto.setSsn(entity.getSsn());
        dto.setPhone(entity.getPhone());
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

    public static USABankAccount toEntity(USABankAccountDto dto) {
        USABankAccount entity = new USABankAccount();
        entity.setId(dto.getId());
        entity.setFullName(dto.getFullName());
        entity.setSsn(dto.getSsn());
        entity.setPhone(dto.getPhone());
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
