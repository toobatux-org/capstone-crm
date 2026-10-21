package com.northstar.crm.repo;

import com.northstar.crm.domain.CustomerEntity;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CustomerRepository extends JpaRepository<CustomerEntity, Long> {
  Optional<CustomerEntity> findByPublicId(String publicId);

  Page<CustomerEntity> findByPublicIdContainingIgnoreCaseOrFullNameContainingIgnoreCase(
      String publicId, String fullName, Pageable pageable);

  @Query(
      value =
          """
          select coalesce(max(cast(substring(public_id from 5) as integer)), 1000)
          from customer
          where public_id ~ '^CUS-[0-9]+$'
          """,
      nativeQuery = true)
  Integer findMaxCustomerNumber();
}
