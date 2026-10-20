package com.northstar.crm.messaging;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

/** NFR-5: the same eventId processed twice has only one effect. Needs local Postgres. */
@SpringBootTest
@Transactional
class InteractionEventProcessorIT {

    @Autowired InteractionEventProcessor processor;
    @Autowired JdbcTemplate jdbc;

    @Test
    void sameEventIdTwice_isProcessedOnce() {
        CustomerInteractionRecordedV1 event = new CustomerInteractionRecordedV1(
                UUID.randomUUID(), CustomerInteractionRecordedV1.TYPE, CustomerInteractionRecordedV1.VERSION,
                UUID.randomUUID(), "CUS-1001", "NOTE", "lab-request-001", Instant.now());

        assertThat(processor.process(event)).isTrue();
        assertThat(processor.process(event)).isFalse();
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM processed_event WHERE event_id = ?", Integer.class, event.eventId()))
                .isEqualTo(1);
    }
}
