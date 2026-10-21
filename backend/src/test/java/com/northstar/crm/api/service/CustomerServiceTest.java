package com.northstar.crm.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.northstar.crm.domain.CustomerEntity;
import com.northstar.crm.repo.CustomerRepository;
import com.northstar.crm.service.CustomerService;
import com.northstar.crm.service.UnknownCustomerException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

  @Mock private CustomerRepository customerRepository;
  @Mock private CustomerEntity customer;
  @InjectMocks private CustomerService customerService;

  @Test
  void search_trimsQueryAndMapsCustomers() {
    Instant createdAt = Instant.parse("2026-01-15T10:00:00Z");
    given(customer.getPublicId()).willReturn("CUS-1001");
    given(customer.getFullName()).willReturn("Amina Khan");
    given(customer.getStatus()).willReturn("ACTIVE");
    given(customer.getCreatedAt()).willReturn(createdAt);
    given(
            customerRepository
                .findTop50ByPublicIdContainingIgnoreCaseOrFullNameContainingIgnoreCaseOrderByFullNameAsc(
                    "Amina", "Amina"))
        .willReturn(List.of(customer));

    var results = customerService.search("  Amina  ");

    assertThat(results).hasSize(1);
    assertThat(results.getFirst().customerId()).isEqualTo("CUS-1001");
    assertThat(results.getFirst().fullName()).isEqualTo("Amina Khan");
    assertThat(results.getFirst().status()).isEqualTo("ACTIVE");
    assertThat(results.getFirst().createdAt()).isEqualTo(createdAt);
  }

  @Test
  void search_blankQueryReturnsCustomerOptions() {
    given(customerRepository.findTop50ByOrderByFullNameAsc()).willReturn(List.of(customer));

    assertThat(customerService.search("   ")).hasSize(1);
    verify(customerRepository).findTop50ByOrderByFullNameAsc();
  }

  @Test
  void get_missingCustomerThrowsNotFoundException() {
    given(customerRepository.findByPublicId("CUS-9999")).willReturn(Optional.empty());

    assertThrows(UnknownCustomerException.class, () -> customerService.get("CUS-9999"));
  }

  @Test
  void get_existingCustomerReturnsProfile() {
    Instant createdAt = Instant.parse("2026-01-15T10:00:00Z");
    given(customer.getPublicId()).willReturn("CUS-1001");
    given(customer.getFullName()).willReturn("Amina Khan");
    given(customer.getStatus()).willReturn("ACTIVE");
    given(customer.getCreatedAt()).willReturn(createdAt);
    given(customerRepository.findByPublicId("CUS-1001")).willReturn(Optional.of(customer));

    var profile = customerService.get("CUS-1001");

    assertThat(profile.customerId()).isEqualTo("CUS-1001");
    assertThat(profile.fullName()).isEqualTo("Amina Khan");
    assertThat(profile.status()).isEqualTo("ACTIVE");
    verify(customerRepository).findByPublicId("CUS-1001");
  }
}
