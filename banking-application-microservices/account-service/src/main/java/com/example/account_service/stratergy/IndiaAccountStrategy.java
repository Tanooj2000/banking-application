package com.example.account_service.stratergy;

import org.springframework.stereotype.Component;

import com.example.account_service.dto.IndiaAccountRequest;
import com.example.account_service.entity.*;

@Component
public class IndiaAccountStrategy implements AccountCreationStrategy {

    @Override
    public Account createAccount(Object request) {
        IndiaAccountRequest req = (IndiaAccountRequest) request;
        System.out.println("Creating account for India: " + req);
        
        Account account = new Account();
        
        // System fields
        account.setUserId(req.getUserId());
        account.setBank(req.getBank());
        account.setBranch(req.getBranch());
        account.setIfscCode(req.getIfscCode());
        account.setCountry("INDIA");
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
        personalDetails.setAadhaar(req.getAadhaar());
        personalDetails.setPan(req.getPan());
        personalDetails.setMobile(req.getMobile());
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
        incomeDetails.setEmploymentStatus(IncomeDetails.EmploymentStatus.valueOf(req.getEmploymentStatus().replace(" ", "_").replace("-", "_").toUpperCase()));
        incomeDetails.setEmployerName(req.getEmployerName());
        incomeDetails.setOccupation(req.getOccupation());
        incomeDetails.setMonthlyIncome(req.getMonthlyIncome());
        incomeDetails.setAnnualIncome(req.getAnnualIncome());
        incomeDetails.setIncomeSource(IncomeDetails.IncomeSource.valueOf(req.getIncomeSource().toUpperCase()));
        incomeDetails.setCurrencyCode("INR");
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
        return "INDIA";
    }
    
    @Override
    public boolean validateCountrySpecificFields(Object request) {
        IndiaAccountRequest req = (IndiaAccountRequest) request;
        
        // Validate Aadhaar (12 digits)
        if (req.getAadhaar() == null || !req.getAadhaar().matches("^[0-9]{12}$")) {
            return false;
        }
        
        // Validate PAN (AAAAA9999A format)
        if (req.getPan() == null || !req.getPan().matches("^[A-Z]{5}[0-9]{4}[A-Z]{1}$")) {
            return false;
        }
        
        // Validate Indian mobile number (10 digits starting with 6-9)
        if (req.getMobile() == null || !req.getMobile().matches("^[6-9][0-9]{9}$")) {
            return false;
        }
        
        return true;
    }
}