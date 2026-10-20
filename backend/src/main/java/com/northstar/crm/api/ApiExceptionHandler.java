package com.northstar.crm.api;

import com.northstar.crm.service.UnknownCustomerException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
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


