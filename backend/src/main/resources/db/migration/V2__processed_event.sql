-- Consumer idempotency (NFR-5): one row per eventId already handled
CREATE TABLE processed_event (
    event_id      UUID PRIMARY KEY,
    processed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);