package com.example.root_admin_service.enums;

public enum Role {
    ROOT_ADMIN("ROLE_ROOT_ADMIN");

    private final String authority;

    Role(String authority) {
        this.authority = authority;
    }

    public String getAuthority() {
        return authority;
    }

    @Override
    public String toString() {
        return authority;
    }
}