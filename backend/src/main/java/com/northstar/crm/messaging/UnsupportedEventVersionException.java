package com.northstar.crm.messaging;

/** Thrown for events whose eventVersion this consumer can't read. Not retried: goes straight to the DLT. */
public class UnsupportedEventVersionException extends RuntimeException {
    public UnsupportedEventVersionException(String version) {
        super("Unsupported eventVersion: " + version);
    }
}