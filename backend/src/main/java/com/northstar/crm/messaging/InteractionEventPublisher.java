package com.northstar.crm.messaging;

import com.northstar.crm.domain.InteractionEntity;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Slf4j
@Component
public class InteractionEventPublisher {

  public static final String TOPIC = "crm.customer.interactions.v1";

  private final KafkaTemplate<String, CustomerInteractionRecordedV1> kafkaTemplate;

  public InteractionEventPublisher(KafkaTemplate<String, CustomerInteractionRecordedV1> kafkaTemplate) {
    this.kafkaTemplate = kafkaTemplate;
  }

  /** Call after saving. The event is sent only if the surrounding transaction commits (ADR-002). */
  public void publish(InteractionEntity saved) {
    CustomerInteractionRecordedV1 event = toEvent(saved);
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
      log.debug("Transaction active. Registering after-commit hook to publish eventId [{}]", event.eventId());
      TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
        @Override
        public void afterCommit() {
          send(event);
        }
      });
    } else {
      // No transaction: the save has already committed
      log.warn("No active transaction found during publish. Sending eventId [{}] immediately.", event.eventId());
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
              } else {
                log.info("Successfully published interaction event [type={}, id={}, customer={}] to topic [{}]",
                        event.eventType(), event.interactionId(), event.customerId(), TOPIC);
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