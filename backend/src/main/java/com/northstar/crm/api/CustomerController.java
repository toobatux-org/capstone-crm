package com.northstar.crm.api;

import com.northstar.crm.api.dto.CustomerResponse;
import com.northstar.crm.service.CustomerService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customers")
@CrossOrigin(
    origins = "http://localhost:4200",
    allowedHeaders = {"Authorization", "Content-Type", "X-Correlation-ID", "X-Correlation-Id"})
public class CustomerController {

  private final CustomerService customerService;

  public CustomerController(CustomerService customerService) {
    this.customerService = customerService;
  }

  @GetMapping
  @PreAuthorize("hasAnyAuthority('AGENT','ADMIN')")
  public List<CustomerResponse> search(@RequestParam(required = false, defaultValue = "") String q) {
    return customerService.search(q);
  }

  @GetMapping("/{customerId}")
  @PreAuthorize("hasAnyAuthority('AGENT','ADMIN')")
  public CustomerResponse get(@PathVariable String customerId) {
    return customerService.get(customerId);
  }
}
