package com.example.rag_chatbot_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AccountOptionDTO {
    @JsonProperty("selection_id")
    private String selectionId;

    private Integer index;

    @JsonProperty("bank_name")
    private String bankName;

    @JsonProperty("account_number_masked")
    private String accountNumberMasked;

    private String status;
    private String country;

    public String getSelectionId() {
        return selectionId;
    }

    public void setSelectionId(String selectionId) {
        this.selectionId = selectionId;
    }

    public Integer getIndex() {
        return index;
    }

    public void setIndex(Integer index) {
        this.index = index;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getAccountNumberMasked() {
        return accountNumberMasked;
    }

    public void setAccountNumberMasked(String accountNumberMasked) {
        this.accountNumberMasked = accountNumberMasked;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }
}
