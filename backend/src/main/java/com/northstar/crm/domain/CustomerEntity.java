package com.northstar.crm.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "customer")
public class CustomerEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "customer_id")
  private Long id;

  @Column(name = "public_id", nullable = false, unique = true)
  private String publicId;

  @Column(unique = true, nullable = false)
  private String username;

  @Column(nullable = false)
  private String password; // Holds Bcrypt hashed password

  @Column(name = "full_name", nullable = false)
  private String fullName;

  @Column(nullable = false)
  private String status;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "customer_roles", joinColumns = @JoinColumn(name = "customer_id"))
  @Enumerated(EnumType.STRING)
  @Column(name = "role", nullable = false)
  private List<UserRole> roles;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  public Long getId() { return id; }
  public String getPublicId() { return publicId; }
  public String getFullName() { return fullName; }
  public String getUsername() { return username; }
  public String getPassword() { return password; }
  public String getStatus() { return status; }
  public List<UserRole> getRoles() { return roles; }

  public void setPublicId(String publicId) { this.publicId = publicId; }
  public void setUsername(String username) { this.username = username; }
  public void setPassword(String password) { this.password = password; }
  public void setFullName(String fullName) { this.fullName = fullName; }
  public void setStatus(String status) { this.status = status; }
  public void setRoles(List<UserRole> roles) { this.roles = roles; }
}
