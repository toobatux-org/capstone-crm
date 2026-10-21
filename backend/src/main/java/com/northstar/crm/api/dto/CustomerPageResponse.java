package com.northstar.crm.api.dto;

import java.util.List;

public record CustomerPageResponse(
    List<CustomerResponse> content, int page, int size, long totalElements, int totalPages) {}
