package com.northstar.crm.api.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterRequestDto(
        @NotBlank(message = "Username is required")
    String username,
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    String email,
    @NotBlank(message = "Password is required")
    String password,
    @NotBlank(message = "Role is required")
    String role
) {}