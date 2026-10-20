package com.northstar.crm.messaging;

import java.time.Instant;
import java.util.UUID;

/**
 * Kafka event contract: CustomerInteractionRecorded v1 on crm.customer.interactions.v1,
 * keyed by customerId (the public ID, e.g. CUS-1001).
 */
public record CustomerInteractionRecordedV1(
        UUID eventId,
        String eventType,
        String eventVersion,
        UUID interactionId,
        String customerId,
        String interactionType,
        String correlationId,
        Instant occurredAt
) {
  public static final String TYPE = "CustomerInteractionRecorded";
  public static final String VERSION = "1";
}