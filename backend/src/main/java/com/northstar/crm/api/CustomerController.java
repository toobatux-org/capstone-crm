package com.northstar.crm.api;

import com.northstar.crm.api.dto.CreateCustomerRequest;
import com.northstar.crm.api.dto.CustomerPageResponse;
import com.northstar.crm.api.dto.CustomerResponse;
import com.northstar.crm.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

  private final CustomerService customerService;

  public CustomerController(CustomerService customerService) {
    this.customerService = customerService;
  }

  @GetMapping
  @PreAuthorize("hasAnyAuthority('AGENT','ADMIN')")
  public CustomerPageResponse search(
      @RequestParam(name = "q", defaultValue = "") String query,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    return customerService.search(query, page, size);
  }

  @PostMapping
  @PreAuthorize("hasAnyAuthority('AGENT','ADMIN')")
  public ResponseEntity<CustomerResponse> create(@Valid @RequestBody CreateCustomerRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(customerService.create(request));
  }

  @PutMapping("/{publicId}")
  @PreAuthorize("hasAnyAuthority('AGENT','ADMIN')")
  public CustomerResponse update(
      @PathVariable String publicId, @Valid @RequestBody CreateCustomerRequest request) {
    return customerService.update(publicId, request);
  }

  @DeleteMapping("/{publicId}")
  @PreAuthorize("hasAuthority('ADMIN')")
  public ResponseEntity<Void> delete(@PathVariable String publicId) {
    customerService.delete(publicId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{publicId}")
  @PreAuthorize("hasAnyAuthority('AGENT','ADMIN')")
  public CustomerResponse get(@PathVariable String publicId) {
    return customerService.get(publicId);
  }
}
