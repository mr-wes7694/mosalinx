-- Add event types for calendar categorization and visual indicators.
ALTER TABLE calendar_events
    ADD COLUMN event_type VARCHAR(50) NOT NULL DEFAULT 'Other'
    AFTER event_title;
