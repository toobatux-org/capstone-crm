package com.northstar.crm.api.service;

import com.northstar.crm.api.dto.auth.AuthResponseDto;
import com.northstar.crm.api.dto.auth.LoginRequestDto;
import com.northstar.crm.domain.UserEntity;
import com.northstar.crm.repo.UserRepository;
import com.northstar.crm.security.JwtService;
import com.northstar.crm.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.Optional;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {
    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private LoginRequestDto loginRequest;
    private UserEntity user;

    @BeforeEach
    void setup() {
        loginRequest = new LoginRequestDto("testuser", "testpassword");
        user = new UserEntity();
        user.setUsername("testuser");
        user.setPassword("encodedpassword");
    }

    @Test
    void shouldAuthenticateUserAndReturnToken() {
        String mockToken = "mocked.jwt.token";
        given(userRepository.findByUsername(loginRequest.username())).willReturn(Optional.of(user));
        given(jwtService.generateToken(user)).willReturn(mockToken);

        AuthResponseDto response = authService.authenticate(loginRequest);

        assertThat(response).isNotNull();
        assertThat(response.token()).isEqualTo(mockToken);
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }
}