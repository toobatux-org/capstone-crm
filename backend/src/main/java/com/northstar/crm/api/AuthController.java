package com.northstar.crm.api;

import com.northstar.crm.api.dto.auth.AuthResponseDto;
import com.northstar.crm.api.dto.auth.LoginRequestDto;
import com.northstar.crm.api.dto.auth.RegisterRequestDto;
import com.northstar.crm.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody RegisterRequestDto request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> authenticate(@Valid @RequestBody LoginRequestDto request) {
        return ResponseEntity.ok(authService.authenticate(request));
    }
}
