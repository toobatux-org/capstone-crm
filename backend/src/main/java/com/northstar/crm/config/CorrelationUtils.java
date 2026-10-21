package com.northstar.crm.config;

import org.slf4j.MDC;

public final class CorrelationUtils {

    public static final String DEFAULT_CORRELATION_ID = "lab-request-001";
    public static final String MDC_KEY = "correlationId";

    private CorrelationUtils() {
        // Prevent instantiation
    }

    /**
     * Resolves the active correlation ID from the MDC, falling back to a default if missing.
     */
    public static String resolveCorrelationId() {
        String mdcCorrelation = MDC.get(MDC_KEY);
        return mdcCorrelation != null && !mdcCorrelation.isBlank()
                ? mdcCorrelation
                : DEFAULT_CORRELATION_ID;
    }
}