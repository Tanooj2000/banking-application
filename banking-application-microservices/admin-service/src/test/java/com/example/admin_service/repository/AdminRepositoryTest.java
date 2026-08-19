package com.example.admin_service.repository;

import com.example.admin_service.entity.Admin;
import com.example.admin_service.entity.ApplicationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@DisplayName("AdminRepository Tests")
class AdminRepositoryTest {

    @Autowired
    private AdminRepository adminRepository;

    private Admin buildAdmin(String username, String email, String bankname,
                              ApplicationStatus status, boolean verified) {
        Admin admin = new Admin();
        admin.setUsername(username);
        admin.setEmail(email);
        admin.setBankname(bankname);
        admin.setCountry("IN");
        admin.setPassword("encodedPassword");
        admin.setVerifiedByRoot(verified);
        admin.setApplicationStatus(status);
        admin.setCreatedDate(LocalDateTime.now());
        return admin;
    }

    @BeforeEach
    void cleanUp() {
        adminRepository.deleteAll();
    }

    // =========================================================================
    // findByUsername()
    // =========================================================================

    @Nested @DisplayName("findByUsername()")
    class FindByUsername {

        @Test @DisplayName("returns admin when username exists")
        void found() {
            adminRepository.save(buildAdmin("admin1","a@b.com","BankA",ApplicationStatus.PENDING,false));
            Optional<Admin> result = adminRepository.findByUsername("admin1");
            assertThat(result).isPresent();
            assertThat(result.get().getUsername()).isEqualTo("admin1");
        }

        @Test @DisplayName("returns empty when username does not exist")
        void notFound() {
            Optional<Admin> result = adminRepository.findByUsername("ghost");
            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // findByEmail()
    // =========================================================================

    @Nested @DisplayName("findByEmail()")
    class FindByEmail {

        @Test @DisplayName("returns admin when email exists")
        void found() {
            adminRepository.save(buildAdmin("admin1","a@b.com","BankA",ApplicationStatus.PENDING,false));
            Optional<Admin> result = adminRepository.findByEmail("a@b.com");
            assertThat(result).isPresent();
            assertThat(result.get().getEmail()).isEqualTo("a@b.com");
        }

        @Test @DisplayName("returns empty when email does not exist")
        void notFound() {
            Optional<Admin> result = adminRepository.findByEmail("ghost@b.com");
            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // findByBankname()
    // =========================================================================

    @Nested @DisplayName("findByBankname()")
    class FindByBankname {

        @Test @DisplayName("returns all admins for the bank")
        void returnsAdminsForBank() {
            adminRepository.save(buildAdmin("admin1","a@b.com","BankA",ApplicationStatus.APPROVED,true));
            adminRepository.save(buildAdmin("admin2","b@b.com","BankA",ApplicationStatus.PENDING,false));
            adminRepository.save(buildAdmin("admin3","c@b.com","BankB",ApplicationStatus.PENDING,false));
            List<Admin> result = adminRepository.findByBankname("BankA");
            assertThat(result).hasSize(2);
            assertThat(result).allMatch(a -> a.getBankname().equals("BankA"));
        }

        @Test @DisplayName("returns empty list when no admins for the bank")
        void returnsEmptyForUnknownBank() {
            List<Admin> result = adminRepository.findByBankname("UnknownBank");
            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // findByApplicationStatus()
    // =========================================================================

    @Nested @DisplayName("findByApplicationStatus()")
    class FindByApplicationStatus {

        @Test @DisplayName("returns only PENDING admins")
        void returnsPendingAdmins() {
            adminRepository.save(buildAdmin("admin1","a@b.com","BankA",ApplicationStatus.PENDING,false));
            adminRepository.save(buildAdmin("admin2","b@b.com","BankB",ApplicationStatus.APPROVED,true));
            adminRepository.save(buildAdmin("admin3","c@b.com","BankC",ApplicationStatus.REJECTED,false));
            List<Admin> result = adminRepository.findByApplicationStatus(ApplicationStatus.PENDING);
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getUsername()).isEqualTo("admin1");
        }

        @Test @DisplayName("returns only APPROVED admins")
        void returnsApprovedAdmins() {
            adminRepository.save(buildAdmin("admin1","a@b.com","BankA",ApplicationStatus.APPROVED,true));
            adminRepository.save(buildAdmin("admin2","b@b.com","BankB",ApplicationStatus.PENDING,false));
            List<Admin> result = adminRepository.findByApplicationStatus(ApplicationStatus.APPROVED);
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getUsername()).isEqualTo("admin1");
        }

        @Test @DisplayName("returns only REJECTED admins")
        void returnsRejectedAdmins() {
            adminRepository.save(buildAdmin("admin1","a@b.com","BankA",ApplicationStatus.REJECTED,false));
            adminRepository.save(buildAdmin("admin2","b@b.com","BankB",ApplicationStatus.PENDING,false));
            List<Admin> result = adminRepository.findByApplicationStatus(ApplicationStatus.REJECTED);
            assertThat(result).hasSize(1);
        }

        @Test @DisplayName("returns empty list when no admins match status")
        void returnsEmptyList() {
            adminRepository.save(buildAdmin("admin1","a@b.com","BankA",ApplicationStatus.APPROVED,true));
            List<Admin> result = adminRepository.findByApplicationStatus(ApplicationStatus.REJECTED);
            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // save / findById
    // =========================================================================

    @Nested @DisplayName("save() and findById()")
    class SaveAndFind {

        @Test @DisplayName("persists admin and retrieves by id")
        void saveAndFindById() {
            Admin saved = adminRepository.save(buildAdmin("admin1","a@b.com","BankA",ApplicationStatus.PENDING,false));
            assertThat(saved.getId()).isNotNull();
            Optional<Admin> found = adminRepository.findById(saved.getId());
            assertThat(found).isPresent();
            assertThat(found.get().getUsername()).isEqualTo("admin1");
        }

        @Test @DisplayName("updates existing admin fields")
        void updatesAdmin() {
            Admin admin = adminRepository.save(buildAdmin("admin1","a@b.com","BankA",ApplicationStatus.PENDING,false));
            admin.setApplicationStatus(ApplicationStatus.APPROVED);
            admin.setVerifiedByRoot(true);
            adminRepository.save(admin);
            Admin updated = adminRepository.findById(admin.getId()).get();
            assertThat(updated.getApplicationStatus()).isEqualTo(ApplicationStatus.APPROVED);
            assertThat(updated.isVerifiedByRoot()).isTrue();
        }
    }
}