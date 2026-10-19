package com.northstar.crm.api.dto.auth;

public record LoginRequest(
        String username,
        String password
) {}
