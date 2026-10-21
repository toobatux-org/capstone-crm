package com.northstar.crm.api.repo;

import com.northstar.crm.PostgresContainerTest;
import com.northstar.crm.domain.UserEntity;
import com.northstar.crm.repo.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class UserRepositoryTest extends PostgresContainerTest {

    @Autowired
    private TestEntityManager testEntityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldFindByUsername() {
        UserEntity user = new UserEntity();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("password");

        testEntityManager.persistAndFlush(user);

        Optional<UserEntity> userEntity =
                userRepository.findByUsername("testuser");

        assertThat(userEntity).isPresent();
        assertThat(userEntity.get().getUsername()).isEqualTo("testuser");
    }

    @Test
    void shouldReturnEmptyWhenUsernameNotFound() {
        Optional<UserEntity> userEntity =
                userRepository.findByUsername("nonexistentuser");

        assertThat(userEntity).isEmpty();
    }
}