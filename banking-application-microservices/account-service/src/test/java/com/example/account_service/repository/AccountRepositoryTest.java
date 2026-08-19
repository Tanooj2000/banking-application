package com.example.account_service.repository;

import com.example.account_service.entity.Account;
import com.example.account_service.entity.AccountStatus;
import com.example.account_service.entity.AccountType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@DisplayName("AccountRepository Tests")
class AccountRepositoryTest {

    @Autowired
    private AccountRepository accountRepository;

    private Account buildAccount(String userId, String bank, String branch, String country, AccountStatus status) {
        Account account = new Account();
        account.setUserId(userId);
        account.setBank(bank);
        account.setBranch(branch);
        account.setCountry(country);
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(status);
        account.setDeposit(new BigDecimal("1000.00"));
        account.setConsent(true);
        account.setCreatedBy("SYSTEM");
        return account;
    }

    @Test
    @DisplayName("save persists a new account")
    void savePersistsNewAccount() {
        Account saved = accountRepository.save(buildAccount("user1", "BankA", "Branch1", "INDIA", AccountStatus.PENDING));

        assertThat(saved.getId()).isNotNull();
        assertThat(accountRepository.findById(saved.getId())).isPresent();
    }

    @Nested @DisplayName("Query methods")
    class QueryMethods {

        @Test
        @DisplayName("findByUserId returns matching accounts")
        void findByUserIdReturnsMatchingAccounts() {
            accountRepository.save(buildAccount("user1", "BankA", "Branch1", "INDIA", AccountStatus.PENDING));

            assertThat(accountRepository.findByUserId("user1")).hasSize(1);
        }

        @Test
        @DisplayName("findByBank and findByBankAndBranch return matching accounts")
        void findByBankQueriesReturnMatchingAccounts() {
            accountRepository.save(buildAccount("user1", "BankA", "Branch1", "INDIA", AccountStatus.PENDING));
            accountRepository.save(buildAccount("user2", "BankA", "Branch2", "INDIA", AccountStatus.APPROVED));

            assertThat(accountRepository.findByBank("BankA")).hasSize(2);
            assertThat(accountRepository.findByBankAndBranch("BankA", "Branch1")).hasSize(1);
        }

        @Test
        @DisplayName("findByAccountNumber returns matching account")
        void findByAccountNumberReturnsMatchingAccount() {
            Account saved = accountRepository.save(buildAccount("user1", "BankA", "Branch1", "INDIA", AccountStatus.PENDING));
            saved.setAccountNumber("IN0000000001");
            accountRepository.save(saved);

            assertThat(accountRepository.findByAccountNumber("IN0000000001")).isPresent();
        }

        @Test
        @DisplayName("findByStatus and findByStatusAndCountry return matching accounts")
        void findByStatusQueriesReturnMatchingAccounts() {
            accountRepository.save(buildAccount("user1", "BankA", "Branch1", "INDIA", AccountStatus.PENDING));
            accountRepository.save(buildAccount("user2", "BankA", "Branch2", "USA", AccountStatus.APPROVED));

            assertThat(accountRepository.findByStatus(AccountStatus.PENDING)).hasSize(1);
            assertThat(accountRepository.findByStatusAndCountry(AccountStatus.APPROVED, "USA")).hasSize(1);
        }

        @Test
        @DisplayName("findByCountry returns matching accounts")
        void findByCountryReturnsMatchingAccounts() {
            accountRepository.save(buildAccount("user1", "BankA", "Branch1", "INDIA", AccountStatus.PENDING));

            assertThat(accountRepository.findByCountry("INDIA")).hasSize(1);
        }

        @Test
        @DisplayName("existsByUserIdAndBankAndBranch returns true for duplicate account")
        void existsByUserIdAndBankAndBranchReturnsTrue() {
            accountRepository.save(buildAccount("user1", "BankA", "Branch1", "INDIA", AccountStatus.PENDING));

            assertThat(accountRepository.existsByUserIdAndBankAndBranch("user1", "BankA", "Branch1")).isTrue();
            assertThat(accountRepository.existsByAccountNumber("IN0000000001")).isFalse();
        }

        @Test
        @DisplayName("custom count queries return expected totals")
        void countQueriesReturnExpectedTotals() {
            accountRepository.save(buildAccount("user1", "BankA", "Branch1", "INDIA", AccountStatus.PENDING));
            accountRepository.save(buildAccount("user2", "BankA", "Branch2", "USA", AccountStatus.APPROVED));

            assertThat(accountRepository.countByStatus(AccountStatus.PENDING)).isEqualTo(1L);
            assertThat(accountRepository.countByCountryAndStatus("USA", AccountStatus.APPROVED)).isEqualTo(1L);
        }

        @Test
        @DisplayName("findByUserIdAndStatus and findByBankAndStatus return matching accounts")
        void complexQueriesReturnMatchingAccounts() {
            accountRepository.save(buildAccount("user1", "BankA", "Branch1", "INDIA", AccountStatus.PENDING));
            accountRepository.save(buildAccount("user1", "BankA", "Branch2", "INDIA", AccountStatus.APPROVED));

            assertThat(accountRepository.findByUserIdAndStatus("user1", AccountStatus.APPROVED)).hasSize(1);
            assertThat(accountRepository.findByBankAndStatus("BankA", AccountStatus.PENDING)).hasSize(1);
        }
    }
}