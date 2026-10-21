package com.northstar.crm.config;

import com.northstar.crm.domain.UserEntity;
import com.northstar.crm.domain.UserRole;
import com.northstar.crm.repo.UserRepository;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AdminAccountInitializer implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(AdminAccountInitializer.class);

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final String username;
  private final String email;
  private final String password;

  public AdminAccountInitializer(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      @Value("${app.admin.username:}") String username,
      @Value("${app.admin.email:}") String email,
      @Value("${app.admin.password:}") String password) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.username = username;
    this.email = email;
    this.password = password;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    if (username.isBlank() || password.isBlank()) {
      log.info("Admin account is not configured; startup admin was skipped");
      return;
    }

    String adminEmail = email.isBlank() ? username + "@northstar.lab" : email;
    UserEntity user = userRepository.findByUsername(username).orElseGet(UserEntity::new);
    user.setUsername(username);
    user.setEmail(adminEmail);
    user.setPassword(passwordEncoder.encode(password));
    user.setRoles(new ArrayList<>(List.of(UserRole.ADMIN)));
    userRepository.save(user);
    log.info("Admin account is ready for username {}", username);
  }
}