package com.northstar.crm.messaging;

import com.northstar.crm.domain.InteractionEntity;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class InteractionEventPublisher {

  public static final String TOPIC = "crm.customer.interactions.v1";

  private static final Logger log = LoggerFactory.getLogger(InteractionEventPublisher.class);

  private final KafkaTemplate<String, CustomerInteractionRecordedV1> kafkaTemplate;

  public InteractionEventPublisher(KafkaTemplate<String, CustomerInteractionRecordedV1> kafkaTemplate) {
    this.kafkaTemplate = kafkaTemplate;
  }

  /** Call after saving. The event is sent only if the surrounding transaction commits (ADR-002). */
  public void publish(InteractionEntity saved) {
    CustomerInteractionRecordedV1 event = toEvent(saved);
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
      TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
        @Override
        public void afterCommit() {
          send(event);
        }
      });
    } else {
      // No transaction: the save has already committed
      send(event);
    }
  }

  private void send(CustomerInteractionRecordedV1 event) {
    // Key = public customer ID, so one customer's events stay in order on one partition
    kafkaTemplate.send(TOPIC, event.customerId(), event)
            .whenComplete((result, ex) -> {
              if (ex != null) {
                log.error("Publish failed for interaction {} (eventId {})",
                        event.interactionId(), event.eventId(), ex);
              }
            });
  }

  private static CustomerInteractionRecordedV1 toEvent(InteractionEntity saved) {
    return new CustomerInteractionRecordedV1(
            UUID.randomUUID(),
            CustomerInteractionRecordedV1.TYPE,
            CustomerInteractionRecordedV1.VERSION,
            saved.getId(),
            saved.getCustomer().getPublicId(),
            saved.getInteractionType(),
            saved.getCorrelationId(),
            saved.getCreatedAt());
  }
}