-- Keep the actual outreach date separate from the date the record was entered.
-- Older entries remain unset rather than claiming their entry date was the encounter date.
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS encounter_date DATE;
