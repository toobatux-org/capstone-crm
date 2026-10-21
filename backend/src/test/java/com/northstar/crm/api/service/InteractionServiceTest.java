package com.northstar.crm.api.service;

import com.northstar.crm.api.dto.CreateInteractionRequest;
import com.northstar.crm.api.dto.InteractionResponse;
import com.northstar.crm.domain.CustomerEntity;
import com.northstar.crm.domain.InteractionEntity;
import com.northstar.crm.messaging.InteractionEventPublisher;
import com.northstar.crm.repo.CustomerRepository;
import com.northstar.crm.repo.InteractionRepository;
import com.northstar.crm.service.InteractionService;
import com.northstar.crm.service.UnknownCustomerException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class InteractionServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private InteractionRepository interactionRepository;

    @Mock
    private InteractionEventPublisher interactionEventPublisher;

    @Mock
    private CustomerEntity customer;

    @InjectMocks
    private InteractionService interactionService;

    @Test
    void create_validInteraction_savesAndPublishes() {
        CreateInteractionRequest request =
                new CreateInteractionRequest(
                        "CUS-1001",
                        "NOTE",
                        "Follow-up on billing question",
                        null);

        given(customer.getPublicId()).willReturn("CUS-1001");

        given(customerRepository.findByPublicId("CUS-1001"))
                .willReturn(Optional.of(customer));

        given(interactionRepository.save(any(InteractionEntity.class)))
                .willAnswer(invocation -> invocation.getArgument(0, InteractionEntity.class));

        InteractionResponse response =
                interactionService.create(request, "test-correlation-123");

        ArgumentCaptor<InteractionEntity> savedCaptor =
                ArgumentCaptor.forClass(InteractionEntity.class);

        verify(interactionRepository).save(savedCaptor.capture());

        InteractionEntity saved = savedCaptor.getValue();

        assertThat(saved.getCustomer()).isSameAs(customer);
        assertThat(saved.getInteractionType()).isEqualTo("NOTE");
        assertThat(saved.getSummary()).isEqualTo("Follow-up on billing question");
        assertThat(saved.getCorrelationId()).isEqualTo("test-correlation-123");

        verify(interactionEventPublisher).publish(saved);

        assertThat(response.customerId()).isEqualTo("CUS-1001");
        assertThat(response.interactionType()).isEqualTo("NOTE");
        assertThat(response.summary()).isEqualTo("Follow-up on billing question");
        assertThat(response.correlationId()).isEqualTo("test-correlation-123");
    }

    @Test
    void create_unknownCustomer_throwsException() {
        CreateInteractionRequest request =
                new CreateInteractionRequest(
                        "CUS-9999",
                        "NOTE",
                        "Should fail",
                        null);

        given(customerRepository.findByPublicId("CUS-9999"))
                .willReturn(Optional.empty());

        assertThrows(
                UnknownCustomerException.class,
                () -> interactionService.create(request, null));

        verify(interactionRepository, never()).save(any());
        verify(interactionEventPublisher, never()).publish(any());
    }

    @Test
    void list_existingCustomer_returnsInteractions() {
        UUID interactionId = UUID.randomUUID();
        Instant createdAt = Instant.now();

        InteractionEntity interaction = new InteractionEntity();
        interaction.setId(interactionId);
        interaction.setCustomer(customer);
        interaction.setInteractionType("CALL");
        interaction.setSummary("Called customer");
        interaction.setCorrelationId("corr-123");
        interaction.setCreatedAt(createdAt);

        given(customer.getPublicId()).willReturn("CUS-1001");

        given(customerRepository.findByPublicId("CUS-1001"))
                .willReturn(Optional.of(customer));

        given(
                interactionRepository
                        .findByCustomer_PublicIdOrderByCreatedAtDesc("CUS-1001"))
                .willReturn(List.of(interaction));

        List<InteractionResponse> responses =
                interactionService.list("CUS-1001");

        assertThat(responses).hasSize(1);

        InteractionResponse response = responses.get(0);

        assertThat(response.id()).isEqualTo(interactionId);
        assertThat(response.customerId()).isEqualTo("CUS-1001");
        assertThat(response.interactionType()).isEqualTo("CALL");
        assertThat(response.summary()).isEqualTo("Called customer");
        assertThat(response.correlationId()).isEqualTo("corr-123");
        assertThat(response.createdAt()).isEqualTo(createdAt);
    }

    @Test
    void list_unknownCustomer_throwsException() {
        given(customerRepository.findByPublicId("CUS-9999"))
                .willReturn(Optional.empty());

        assertThrows(
                UnknownCustomerException.class,
                () -> interactionService.list("CUS-9999"));

        verify(
                interactionRepository,
                never())
                .findByCustomer_PublicIdOrderByCreatedAtDesc("CUS-9999");
    }
}