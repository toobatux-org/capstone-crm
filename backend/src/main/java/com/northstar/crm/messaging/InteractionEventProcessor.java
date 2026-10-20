package com.northstar.crm.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InteractionEventProcessor {

    private static final Logger log = LoggerFactory.getLogger(InteractionEventProcessor.class);

    private final JdbcTemplate jdbc;

    public InteractionEventProcessor(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Returns false (and does nothing) if this eventId was already processed (NFR-5). */
    @Transactional
    public boolean process(CustomerInteractionRecordedV1 event) {
        int inserted = jdbc.update(
                "INSERT INTO processed_event (event_id) VALUES (?) ON CONFLICT (event_id) DO NOTHING",
                event.eventId());
        if (inserted == 0) {
            log.info("Skipping duplicate event {}", event.eventId());
            return false;
        }
        // The consumer's side effect. If this throws, the insert above rolls back too,
        // so the retry isn't mistaken for a duplicate.
        log.info("Handled {} v{} for interaction {} customer {} correlation {}",
                event.eventType(), event.eventVersion(), event.interactionId(),
                event.customerId(), event.correlationId());
        return true;
    }
}