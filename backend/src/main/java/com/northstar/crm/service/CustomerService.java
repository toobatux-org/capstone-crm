package com.northstar.crm.service;

import com.northstar.crm.api.dto.CreateCustomerRequest;
import com.northstar.crm.api.dto.CustomerPageResponse;
import com.northstar.crm.api.dto.CustomerResponse;
import com.northstar.crm.domain.CustomerEntity;
import com.northstar.crm.repo.CustomerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {

  private static final int MAX_PAGE_SIZE = 50;

  private final CustomerRepository customerRepository;

  public CustomerService(CustomerRepository customerRepository) {
    this.customerRepository = customerRepository;
  }

  public CustomerPageResponse search(String query, int page, int size) {
    int safePage = Math.max(page, 0);
    int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by("fullName").ascending());
    Page<CustomerEntity> result =
        query == null || query.isBlank()
            ? customerRepository.findAll(pageable)
            : customerRepository.findByPublicIdContainingIgnoreCaseOrFullNameContainingIgnoreCase(
                query.trim(), query.trim(), pageable);
    return new CustomerPageResponse(
        result.getContent().stream().map(this::toResponse).toList(),
        result.getNumber(),
        result.getSize(),
        result.getTotalElements(),
        result.getTotalPages());
  }

  @Transactional
  public synchronized CustomerResponse create(CreateCustomerRequest request) {
    int nextNumber = customerRepository.findMaxCustomerNumber() + 1;
    CustomerEntity customer = new CustomerEntity();
    customer.setPublicId("CUS-" + nextNumber);
    customer.setFullName(request.fullName().trim());
    customer.setStatus(request.status());
    return toResponse(customerRepository.save(customer));
  }

  public CustomerResponse get(String publicId) {
    return customerRepository
        .findByPublicId(publicId)
        .map(this::toResponse)
        .orElseThrow(() -> new UnknownCustomerException(publicId));
  }

  private CustomerResponse toResponse(CustomerEntity customer) {
    return new CustomerResponse(customer.getPublicId(), customer.getFullName(), customer.getStatus());
  }
}
