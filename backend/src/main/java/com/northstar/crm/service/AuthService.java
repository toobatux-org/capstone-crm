package com.northstar.crm.service;

import com.northstar.crm.api.dto.auth.AuthResponseDto;
import com.northstar.crm.api.dto.auth.LoginRequestDto;
import com.northstar.crm.api.dto.auth.RegisterRequestDto;
import com.northstar.crm.domain.UserEntity;
import com.northstar.crm.domain.UserRole;
import com.northstar.crm.repo.UserRepository;
import com.northstar.crm.security.JwtService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class AuthService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponseDto register(RegisterRequestDto request) {
        // Check if the username already exists
        if (userRepository.existsByUsername(request.username())) {
            log.atWarn()
                    .addKeyValue("event", "user.registration.failed")
                    .addKeyValue("username", request.username())
                    .log("Registration failed: Username already exists");
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Create a new user entity and save it to the database
        var user = new UserEntity();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRoles(List.of(UserRole.AGENT));
        userRepository.save(user);

        log.atInfo()
                .addKeyValue("event", "user.registration.success")
                .addKeyValue("username", user.getUsername())
                .log("User registered successfully");

        // Generate a JWT token for the newly registered user
        var jwtToken = jwtService.generateToken(user);

        log.atInfo()
                .addKeyValue("event", "user.authenticated")
                .addKeyValue("username", user.getUsername())
                .log("User authenticated successfully following registration");

        return new AuthResponseDto(jwtToken);
    }

    public AuthResponseDto authenticate(LoginRequestDto request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.username(),
                            request.password()
                    )
            );
        } catch (AuthenticationException ex) {
            log.atWarn()
                    .addKeyValue("event", "user.authentication.failed")
                    .addKeyValue("username", request.username())
                    .addKeyValue("exception", ex.getClass().getSimpleName())
                    .log("User login failed");
            throw ex;
        }

        var user = userRepository.findByUsername(request.username()).orElseThrow(
                () -> new RuntimeException("Username not found")
        );

        var jwtToken = jwtService.generateToken(user);

        log.atInfo()
                .addKeyValue("event", "user.authenticated")
                .addKeyValue("username", user.getUsername())
                .log("User logged in successfully");

        return new AuthResponseDto(jwtToken);
    }
}
