package com.northstar.crm.api;

import com.northstar.crm.service.UnknownCustomerException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

  private static final String DEFAULT_CORRELATION_ID = "lab-request-001";

  @ExceptionHandler(UnknownCustomerException.class)
  public ResponseEntity<ProblemDetail> notFound(
          UnknownCustomerException ex, HttpServletRequest request) {

    ProblemDetail problem =
            ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());

    problem.setTitle("Customer not found");
    problem.setProperty("correlationId", correlationId(request));

    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ProblemDetail> invalidArgument(
          IllegalArgumentException ex, HttpServletRequest request) {
    ProblemDetail problem =
            ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
    problem.setTitle("Invalid request");
    problem.setProperty("correlationId", correlationId(request));
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
  }

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ProblemDetail> status(
          ResponseStatusException ex, HttpServletRequest request) {
    HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
    ProblemDetail problem =
            ProblemDetail.forStatusAndDetail(status, ex.getReason());
    problem.setTitle(status.getReasonPhrase());
    problem.setProperty("correlationId", correlationId(request));
    return ResponseEntity.status(status).body(problem);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ProblemDetail> badRequest(
          MethodArgumentNotValidException ex, HttpServletRequest request) {

    ProblemDetail problem =
            ProblemDetail.forStatusAndDetail(
                    HttpStatus.BAD_REQUEST, "Request validation failed");

    problem.setTitle("Invalid request");
    problem.setProperty("correlationId", correlationId(request));

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
  }

  private String correlationId(HttpServletRequest request) {
    String correlationId = request.getHeader("X-Correlation-ID");

    return correlationId != null && !correlationId.isBlank()
            ? correlationId
            : DEFAULT_CORRELATION_ID;
  }
}


