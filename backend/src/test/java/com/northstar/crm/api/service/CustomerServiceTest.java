package com.northstar.crm.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.northstar.crm.domain.CustomerEntity;
import com.northstar.crm.repo.CustomerRepository;
import com.northstar.crm.repo.InteractionRepository;
import com.northstar.crm.service.CustomerService;
import com.northstar.crm.service.UnknownCustomerException;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

  @Mock private CustomerRepository customerRepository;
  @Mock private InteractionRepository interactionRepository;
  @Mock private CustomerEntity customer;
  @InjectMocks private CustomerService customerService;

  @Test
  void search_trimsQueryAndMapsCustomers() {
    given(customer.getPublicId()).willReturn("CUS-1001");
    given(customer.getFullName()).willReturn("Amina Khan");
    given(customer.getStatus()).willReturn("ACTIVE");
    given(
            customerRepository.findByPublicIdContainingIgnoreCaseOrFullNameContainingIgnoreCase(
                eq("Amina"), eq("Amina"), any(Pageable.class)))
        .willReturn(new PageImpl<>(List.of(customer)));

    var results = customerService.search("  Amina  ", 0, 10);

    assertThat(results.content()).hasSize(1);
    assertThat(results.content().getFirst().publicId()).isEqualTo("CUS-1001");
    assertThat(results.content().getFirst().fullName()).isEqualTo("Amina Khan");
    assertThat(results.content().getFirst().status()).isEqualTo("ACTIVE");
  }

  @Test
  void search_blankQueryReturnsCustomerOptions() {
    given(customerRepository.findAll(any(Pageable.class))).willReturn(new PageImpl<>(List.of(customer)));

    assertThat(customerService.search("   ", 0, 10).content()).hasSize(1);
    verify(customerRepository).findAll(any(Pageable.class));
  }

  @Test
  void get_missingCustomerThrowsNotFoundException() {
    given(customerRepository.findByPublicId("CUS-9999")).willReturn(Optional.empty());

    assertThrows(UnknownCustomerException.class, () -> customerService.get("CUS-9999"));
  }

  @Test
  void get_existingCustomerReturnsProfile() {
    given(customer.getPublicId()).willReturn("CUS-1001");
    given(customer.getFullName()).willReturn("Amina Khan");
    given(customer.getStatus()).willReturn("ACTIVE");
    given(customerRepository.findByPublicId("CUS-1001")).willReturn(Optional.of(customer));

    var profile = customerService.get("CUS-1001");

    assertThat(profile.publicId()).isEqualTo("CUS-1001");
    assertThat(profile.fullName()).isEqualTo("Amina Khan");
    assertThat(profile.status()).isEqualTo("ACTIVE");
    verify(customerRepository).findByPublicId("CUS-1001");
  }
}
