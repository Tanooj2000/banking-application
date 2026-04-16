package com.example.account_service.stratergy;

import com.example.account_service.dto.UsaAccountRequest;
import com.example.account_service.entity.*;

import org.springframework.stereotype.Component;

@Component
public class UsaAccountStrategy implements AccountCreationStrategy {

    @Override
    public Account createAccount(Object request) {
        UsaAccountRequest req = (UsaAccountRequest) request;

        Account account = new Account();
        
        // System fields
        account.setUserId(req.getUserId());
        account.setBank(req.getBank());
        account.setBranch(req.getBranch());
        account.setIfscCode(req.getIfscCode());
        account.setCountry("USA");
        account.setAccountType(req.getAccountType());
        account.setDeposit(req.getDeposit());
        account.setConsent(req.getConsent());
        account.setStatus(req.getStatus());
        
        // Personal Details
        PersonalDetails personalDetails = new PersonalDetails();
        personalDetails.setFullName(req.getFullName());
        personalDetails.setDateOfBirth(req.getDob());
        personalDetails.setGender(PersonalDetails.Gender.valueOf(req.getGender()));
        personalDetails.setEmail(req.getEmail());
        personalDetails.setAddress(req.getAddress());
        personalDetails.setSsn(req.getSsn());
        personalDetails.setPhone(req.getPhone());
        account.setPersonalDetails(personalDetails);
        
        // Educational Details  
        EducationalDetails educationalDetails = new EducationalDetails();
        educationalDetails.setEducationLevel(EducationalDetails.EducationLevel.valueOf(req.getEducationLevel().replace(" ", "_").toUpperCase()));
        educationalDetails.setInstitutionName(req.getInstitutionName());
        educationalDetails.setCourse(req.getCourse());
        educationalDetails.setYearOfCompletion(req.getYearOfCompletion());
        educationalDetails.setGrade(req.getGrade());
        account.setEducationalDetails(educationalDetails);
        
        // Income Details
        IncomeDetails incomeDetails = new IncomeDetails();
        incomeDetails.setEmploymentStatus(IncomeDetails.EmploymentStatus.valueOf(req.getEmploymentStatus().replace(" ", "_").toUpperCase()));
        incomeDetails.setEmployerName(req.getEmployerName());
        incomeDetails.setOccupation(req.getOccupation());
        incomeDetails.setMonthlyIncome(req.getMonthlyIncome());
        incomeDetails.setAnnualIncome(req.getAnnualIncome());
        incomeDetails.setIncomeSource(IncomeDetails.IncomeSource.valueOf(req.getIncomeSource().replace(" ", "_").toUpperCase()));
        incomeDetails.setCurrencyCode("USD");
        account.setIncomeDetails(incomeDetails);
        
        // Nominee Details
        NomineeDetails nomineeDetails = new NomineeDetails();
        nomineeDetails.setNomineeName(req.getNomineeName());
        nomineeDetails.setNomineeRelation(NomineeDetails.NomineeRelation.valueOf(req.getNomineeRelation().toUpperCase()));
        nomineeDetails.setNomineeDob(req.getNomineeDob());
        nomineeDetails.setNomineeContact(req.getNomineeContact());
        nomineeDetails.setNomineeAddress(req.getNomineeAddress());
        account.setNomineeDetails(nomineeDetails);
        
        return account; // Don't save here, let service handle it
    }

    @Override
    public String getCountryCode() {
        return "USA";
    }
    
    @Override
    public boolean validateCountrySpecificFields(Object request) {
        UsaAccountRequest req = (UsaAccountRequest) request;
        
        // Validate SSN (999-99-9999 format)
        if (req.getSsn() == null || !req.getSsn().matches("^[0-9]{3}-[0-9]{2}-[0-9]{4}$")) {
            return false;
        }
        
        // Validate US phone number (+1xxxxxxxxxx format)
        if (req.getPhone() == null || !req.getPhone().matches("^\\+1[0-9]{10}$")) {
            return false;
        }
        
        return true;
    }
}
