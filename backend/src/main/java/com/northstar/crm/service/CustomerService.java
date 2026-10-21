package com.northstar.crm.service;

import com.northstar.crm.api.dto.CustomerResponse;
import com.northstar.crm.domain.CustomerEntity;
import com.northstar.crm.repo.CustomerRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {

  private final CustomerRepository customerRepository;

  public CustomerService(CustomerRepository customerRepository) {
    this.customerRepository = customerRepository;
  }

  @Transactional(readOnly = true)
  public List<CustomerResponse> search(String query) {
    String normalizedQuery = query == null ? "" : query.trim();
    if (normalizedQuery.isEmpty()) {
      return customerRepository.findTop50ByOrderByFullNameAsc().stream()
          .map(this::toResponse)
          .toList();
    }

    return customerRepository
        .findTop50ByPublicIdContainingIgnoreCaseOrFullNameContainingIgnoreCaseOrderByFullNameAsc(
            normalizedQuery, normalizedQuery)
        .stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public CustomerResponse get(String customerId) {
    return customerRepository
        .findByPublicId(customerId)
        .map(this::toResponse)
        .orElseThrow(() -> new UnknownCustomerException(customerId));
  }

  private CustomerResponse toResponse(CustomerEntity customer) {
    return new CustomerResponse(
        customer.getPublicId(), customer.getFullName(), customer.getStatus(), customer.getCreatedAt());
  }
}
