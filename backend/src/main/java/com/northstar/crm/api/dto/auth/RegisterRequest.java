package com.northstar.crm.api.dto.auth;

public record RegisterRequest(
    String username,
    String email,
    String password,
    String role
) {}