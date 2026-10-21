package com.northstar.crm.api;

import com.northstar.crm.config.CorrelationUtils;
import com.northstar.crm.service.UnknownCustomerException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(UnknownCustomerException.class)
  public ResponseEntity<ProblemDetail> notFound(UnknownCustomerException ex) {
    String correlationId = CorrelationUtils.resolveCorrelationId();

    log.atWarn()
            .addKeyValue("event", "api.error.not_found")
            .addKeyValue("exception", ex.getClass().getSimpleName())
            .log("Resource not found: {}", ex.getMessage());

    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    problem.setTitle("Customer not found");
    problem.setProperty("correlationId", correlationId);

    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ProblemDetail> badRequest(MethodArgumentNotValidException ex) {
    String correlationId = CorrelationUtils.resolveCorrelationId();

    log.atWarn()
            .addKeyValue("event", "api.error.validation_failed")
            .log("Request validation failed");

    ProblemDetail problem =
            ProblemDetail.forStatusAndDetail(
                    HttpStatus.BAD_REQUEST, "Request validation failed");
    problem.setTitle("Invalid request");
    problem.setProperty("correlationId", correlationId);

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
  }

  @ExceptionHandler(AuthenticationException.class)
  public ResponseEntity<ProblemDetail> unauthorized(AuthenticationException ex) {
    String correlationId = CorrelationUtils.resolveCorrelationId();
    ProblemDetail problem =
            ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Authentication failed");
    problem.setTitle("Unauthorized");
    problem.setProperty("correlationId", correlationId);

    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ProblemDetail> unexpected(Exception ex) {
    String correlationId = CorrelationUtils.resolveCorrelationId();

    log.atError()
            .addKeyValue("event", "api.error.unexpected")
            .addKeyValue("exception", ex.getClass().getSimpleName())
            .addKeyValue("correlationId", correlationId)
            .log("Unhandled API exception", ex);

    ProblemDetail problem =
            ProblemDetail.forStatusAndDetail(
                    HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
    problem.setTitle("Internal server error");
    problem.setProperty("correlationId", correlationId);

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
  }
}