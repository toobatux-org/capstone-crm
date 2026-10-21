package com.northstar.crm.service;

import com.northstar.crm.api.dto.CreateInteractionRequest;
import com.northstar.crm.api.dto.InteractionResponse;
//import com.northstar.crm.domain.Interaction;
import com.northstar.crm.config.CorrelationUtils;
import com.northstar.crm.domain.InteractionEntity;
import com.northstar.crm.messaging.InteractionEventPublisher;
import com.northstar.crm.repo.CustomerRepository;
import com.northstar.crm.repo.InteractionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class InteractionService {
  private final CustomerRepository customerRepository;
  private final InteractionRepository interactionRepository;
  private final InteractionEventPublisher interactionEventPublisher;

  public InteractionService(
          CustomerRepository customerRepository,
          InteractionRepository interactionRepository,
          InteractionEventPublisher interactionEventPublisher) {

    this.customerRepository = customerRepository;
    this.interactionRepository = interactionRepository;
    this.interactionEventPublisher = interactionEventPublisher;
  }

  @Transactional(readOnly = true)
  public List<InteractionResponse> list(String customerId) {
    log.atInfo()
            .addKeyValue("event", "interaction.list.started")
            .addKeyValue("customerPublicId", customerId)
            .log("Fetching interactions for customer public ID: {}", customerId);

    customerRepository
            .findByPublicId(customerId)
            .orElseThrow(() -> {
              log.atWarn()
                      .addKeyValue("event", "interaction.list.failed")
                      .addKeyValue("customerPublicId", customerId)
                      .addKeyValue("reason", "customer_not_found")
                      .log("Attempted to list interactions for unknown customer ID");
              return new UnknownCustomerException(customerId);
            });

    List<InteractionResponse> responses = interactionRepository
            .findByCustomer_PublicIdOrderByCreatedAtDesc(customerId)
            .stream()
            .map(
                    interaction ->
                            new InteractionResponse(
                                    interaction.getId(),
                                    interaction.getCustomer().getPublicId(),
                                    interaction.getInteractionType(),
                                    interaction.getSummary(),
                                    interaction.getCorrelationId(),
                                    interaction.getCreatedAt()))
            .toList();

    log.atInfo()
            .addKeyValue("event", "interaction.list.success")
            .addKeyValue("customerPublicId", customerId)
            .addKeyValue("interactionCount", responses.size())
            .log("Successfully retrieved interactions for customer");

    return responses;
  }

  @Transactional
  public InteractionResponse create(CreateInteractionRequest request, String correlationHeader) {
    String correlationId = CorrelationUtils.resolveCorrelationId();

    log.atInfo()
            .addKeyValue("event", "interaction.create.started")
            .addKeyValue("interactionType", request.interactionType())
            .addKeyValue("customerPublicId", request.customerId())
            .log("Creating interaction");

    var customer =
            customerRepository
                    .findByPublicId(request.customerId())
                    .orElseThrow(() -> {
                      log.warn("Failed to create interaction. Unknown customer ID: {}", request.customerId());
                      return new UnknownCustomerException(request.customerId());
                    });

    log.debug("Resolved correlation ID [{}] for interaction creation", correlationId);

    var interaction = new InteractionEntity();
    interaction.setId(UUID.randomUUID());
    interaction.setCustomer(customer);
    interaction.setInteractionType(request.interactionType());
    interaction.setSummary(request.summary());
    interaction.setCorrelationId(correlationId);

    var saved = interactionRepository.save(interaction);
    log.info("Successfully saved interaction with ID: {} for customer: {}", saved.getId(), customer.getPublicId());

    interactionEventPublisher.publish(saved);                     //publish() now expects an InteractionEntity instead of an Interaction
    log.debug("Successfully published interaction event for interaction ID: {}", saved.getId());

    return new InteractionResponse(
            saved.getId(),
            saved.getCustomer().getPublicId(),
            saved.getInteractionType(),
            saved.getSummary(),
            saved.getCorrelationId(),
            saved.getCreatedAt());
  }
}
