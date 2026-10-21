package com.northstar.crm.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class InteractionApiIT {

  private static final String JWT_SECRET = "bm9ydGhzdGFyLWNybS1sYWItand0LXNlY3JldC1rZXkhIQ==";

  @DynamicPropertySource
  static void postgres(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", () -> "jdbc:postgresql://localhost:5432/crm");
    registry.add("spring.datasource.username", () -> "crm");
    registry.add("spring.datasource.password", () -> "change-me");
    registry.add("spring.security.jwt.secret", () -> JWT_SECRET);
  }

  @Autowired MockMvc mockMvc;

  @Test
  void list_withoutBearer_unauthorized() throws Exception {
    mockMvc
        .perform(get("/api/v1/interactions").param("customerId", "CUS-1001"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void createAndList_forAmina() throws Exception {
    String token = registerAndLogin("agent");

    String body =
        """
        {"customerId":"CUS-1001","interactionType":"NOTE","summary":"Follow-up on billing question","correlationId":"lab-request-001"}
        """;

    mockMvc
        .perform(
            post("/api/v1/interactions")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + token)
                .header("X-Correlation-ID", "lab-request-001")
                .content(body))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.customerId").value("CUS-1001"))
        .andExpect(jsonPath("$.correlationId").value("lab-request-001"));

    mockMvc
        .perform(
            get("/api/v1/interactions")
                .param("customerId", "CUS-1001")
                .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].customerId").value("CUS-1001"));
  }

  @Test
  void create_unknownCustomer_notFound() throws Exception {
    String token = registerAndLogin("agent");
    String body =
        """
        {"customerId":"CUS-9999","interactionType":"NOTE","summary":"Should fail"}
        """;

    mockMvc
        .perform(
            post("/api/v1/interactions")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + token)
                .content(body))
        .andExpect(status().isNotFound());
  }

  @Test
  void agentToken_onAdminDelete_forbidden() throws Exception {
    String agent = registerAndLogin("agent");

    mockMvc
        .perform(
            delete("/api/v1/interactions/" + UUID.randomUUID())
                .header("Authorization", "Bearer " + agent))
        .andExpect(status().isForbidden());
  }

  @Test
  void authFlow_agentAndAdmin() throws Exception {
    String agent = registerAndLogin("agent");
    String admin = registerAndLogin("admin");

    MvcResult created =
        mockMvc
            .perform(
                post("/api/v1/interactions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + agent)
                    .header("X-Correlation-ID", "lab-request-001")
                    .content(
                        """
                        {"customerId":"CUS-1001","interactionType":"NOTE","summary":"Role check","correlationId":"lab-request-001"}
                        """))
            .andExpect(status().isCreated())
            .andReturn();
    String id = JsonPath.read(created.getResponse().getContentAsString(), "$.id");

    mockMvc
        .perform(
            get("/api/v1/interactions")
                .param("customerId", "CUS-1001")
                .header("Authorization", "Bearer " + agent))
        .andExpect(status().isOk());

    mockMvc
        .perform(delete("/api/v1/interactions/" + id).header("Authorization", "Bearer " + agent))
        .andExpect(status().isForbidden());

    mockMvc
        .perform(
            get("/api/v1/interactions")
                .param("customerId", "CUS-1001")
                .header("Authorization", "Bearer " + admin))
        .andExpect(status().isOk());

    mockMvc
        .perform(delete("/api/v1/interactions/" + id).header("Authorization", "Bearer " + admin))
        .andExpect(status().isNoContent());

    mockMvc
        .perform(delete("/api/v1/interactions/" + id).header("Authorization", "Bearer " + admin))
        .andExpect(status().isNotFound());
  }

  private String registerAndLogin(String role) throws Exception {
    String name = role.toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8);
    mockMvc
        .perform(
            post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"username":"%s","email":"%s@northstar.lab","password":"test-pass-1","role":"%s"}
                    """
                        .formatted(name, name, role)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").isNotEmpty());

    MvcResult login =
        mockMvc
            .perform(
                post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"username":"%s","password":"test-pass-1"}
                        """
                            .formatted(name)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andReturn();
    return JsonPath.read(login.getResponse().getContentAsString(), "$.token");
  }
}
