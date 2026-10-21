package com.northstar.crm.api.dto;

import java.time.Instant;

public record CustomerResponse(String customerId, String fullName, String status, Instant createdAt) {}
