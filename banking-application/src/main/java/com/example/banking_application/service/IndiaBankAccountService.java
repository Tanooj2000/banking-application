package com.example.banking_application.service;

import com.example.banking_application.dto.IndiaBankAccountDto;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface IndiaBankAccountService {
    List<IndiaBankAccountDto> getPendingAccounts();
    IndiaBankAccountDto createAccount(IndiaBankAccountDto dto);
    void approveAccount(Long id);
}
