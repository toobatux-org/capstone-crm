package com.northstar.crm.service;

import com.northstar.crm.api.dto.CreateInteractionRequest;
import com.northstar.crm.api.dto.UpdateInteractionRequest;
import com.northstar.crm.api.dto.InteractionResponse;
//import com.northstar.crm.domain.Interaction;
import com.northstar.crm.domain.InteractionEntity;
import com.northstar.crm.messaging.InteractionEventPublisher;
import com.northstar.crm.repo.CustomerRepository;
import com.northstar.crm.repo.InteractionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class InteractionService {

  public static final String DEFAULT_CORRELATION = "lab-request-001";

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

    customerRepository
            .findByPublicId(customerId)
            .orElseThrow(() -> new UnknownCustomerException(customerId));

    return interactionRepository
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
  }

  @Transactional
  public InteractionResponse create(CreateInteractionRequest request, String correlationHeader) {

    var customer =
            customerRepository
                    .findByPublicId(request.customerId())
                    .orElseThrow(() -> new UnknownCustomerException(request.customerId()));

    String correlationId =
            correlationHeader != null && !correlationHeader.isBlank()
                    ? correlationHeader
                    : request.correlationId() != null && !request.correlationId().isBlank()
                    ? request.correlationId()
                    : DEFAULT_CORRELATION;

    var interaction = new InteractionEntity();
    interaction.setId(UUID.randomUUID());
    interaction.setCustomer(customer);
    interaction.setInteractionType(request.interactionType());
    interaction.setSummary(request.summary());
    interaction.setCorrelationId(correlationId);

    var saved = interactionRepository.save(interaction);

    interactionEventPublisher.publish(saved);                     //publish() now expects an InteractionEntity instead of an Interaction

    return new InteractionResponse(
            saved.getId(),
            saved.getCustomer().getPublicId(),
            saved.getInteractionType(),
            saved.getSummary(),
            saved.getCorrelationId(),
            saved.getCreatedAt());
  }

  @Transactional
  public InteractionResponse update(UUID id, UpdateInteractionRequest request) {

    var interaction =
            interactionRepository
                    .findById(id)
                    .orElseThrow(
                            () ->
                                    new ResponseStatusException(
                                            HttpStatus.NOT_FOUND, "Interaction not found"));

    interaction.setInteractionType(request.interactionType());
    interaction.setSummary(request.summary());

    var saved = interactionRepository.save(interaction);

    return new InteractionResponse(
            saved.getId(),
            saved.getCustomer().getPublicId(),
            saved.getInteractionType(),
            saved.getSummary(),
            saved.getCorrelationId(),
            saved.getCreatedAt());
  }

  @Transactional
  public void delete(UUID id) {
    if (!interactionRepository.existsById(id)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Interaction not found");
    }
    interactionRepository.deleteById(id);
  }
}
