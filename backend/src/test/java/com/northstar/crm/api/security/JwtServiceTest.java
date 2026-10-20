package com.northstar.crm.api.security;

import com.northstar.crm.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

public class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;

    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final long JWT_EXPIRATION = 86400000L;

    @BeforeEach
    void setup() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "expiration", JWT_EXPIRATION);;

        userDetails = new User("testuser", "testpassword", Collections.emptyList());
    }

    @Test
    void shouldGenerateAndExtractUsernameFromToken() {
        String token = jwtService.generateToken(userDetails);
        String extractedUsername = jwtService.extractUsername(token);

        assert extractedUsername.equals(userDetails.getUsername());
    }

    @Test
    void shouldValidateToken() {
        String token = jwtService.generateToken(userDetails);
        boolean isValid = jwtService.isTokenValid(token, userDetails);

        assert isValid;
    }
}
