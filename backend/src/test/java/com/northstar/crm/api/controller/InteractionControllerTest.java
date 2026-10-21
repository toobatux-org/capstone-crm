package com.northstar.crm.api.controller;

import com.northstar.crm.api.ApiExceptionHandler;
import com.northstar.crm.api.InteractionController;
import com.northstar.crm.api.dto.CreateInteractionRequest;
import com.northstar.crm.api.dto.InteractionResponse;
import com.northstar.crm.service.InteractionService;
import com.northstar.crm.service.UnknownCustomerException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class InteractionControllerTest {

    private InteractionService interactionService;
    private MockMvc mockMvc;

    @BeforeEach
    void setup() {
        interactionService = mock(InteractionService.class);

        InteractionController controller =
                new InteractionController(interactionService);

        mockMvc =
                MockMvcBuilders.standaloneSetup(controller)
                        .setControllerAdvice(new ApiExceptionHandler())
                        .build();
    }

    @Test
    void create_validInteraction_returns201() throws Exception {
        InteractionResponse response =
                new InteractionResponse(
                        UUID.randomUUID(),
                        "CUS-1001",
                        "NOTE",
                        "Follow-up on billing question",
                        "corr-123",
                        Instant.now());

        given(
                interactionService.create(
                        any(CreateInteractionRequest.class),
                        eq("corr-123")))
                .willReturn(response);

        String body =
                """
                {
                  "customerId": "CUS-1001",
                  "interactionType": "NOTE",
                  "summary": "Follow-up on billing question"
                }
                """;

        mockMvc
                .perform(
                        post("/api/v1/interactions")
                                .contentType(MediaType.APPLICATION_JSON)
                                .header("X-Correlation-ID", "corr-123")
                                .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.customerId").value("CUS-1001"))
                .andExpect(jsonPath("$.interactionType").value("NOTE"))
                .andExpect(jsonPath("$.correlationId").value("corr-123"));
    }

    @Test
    void create_invalidInteraction_returns400() throws Exception {
        String body =
                """
                {
                  "customerId": "CUS-1001",
                  "interactionType": "INVALID",
                  "summary": "Should fail"
                }
                """;

        mockMvc
                .perform(
                        post("/api/v1/interactions")
                                .contentType(MediaType.APPLICATION_JSON)
                                .header("X-Correlation-ID", "corr-400")
                                .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid request"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.correlationId").value("corr-400"));
    }

    @Test
    void create_unknownCustomer_returns404() throws Exception {
        given(
                interactionService.create(
                        any(CreateInteractionRequest.class),
                        any()))
                .willThrow(new UnknownCustomerException("CUS-9999"));

        String body =
                """
                {
                  "customerId": "CUS-9999",
                  "interactionType": "NOTE",
                  "summary": "Should fail"
                }
                """;

        mockMvc
                .perform(
                        post("/api/v1/interactions")
                                .contentType(MediaType.APPLICATION_JSON)
                                .header("X-Correlation-ID", "corr-404")
                                .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Customer not found"))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.detail").value("Unknown customer: CUS-9999"))
                .andExpect(jsonPath("$.correlationId").value("corr-404"));
    }

    @Test
    void list_withoutCustomerId_returnsAllInteractions() throws Exception {
        InteractionResponse response =
                new InteractionResponse(
                        UUID.randomUUID(),
                        "CUS-1002",
                        "EMAIL",
                        "Sent a follow-up",
                        "corr-all",
                        Instant.now());
        given(interactionService.listAll()).willReturn(List.of(response));

        mockMvc
                .perform(get("/api/v1/interactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].customerId").value("CUS-1002"))
                .andExpect(jsonPath("$[0].interactionType").value("EMAIL"));
    }
}