CREATE TABLE journeys (
  id BIGSERIAL PRIMARY KEY,
  owner_user_id TEXT,
  owner_email TEXT,
  recorder_name TEXT NOT NULL,
  soul_name TEXT NOT NULL,
  location TEXT NOT NULL,
  salvation BOOLEAN NOT NULL DEFAULT FALSE,
  salvation_status TEXT NOT NULL DEFAULT 'praying',
  healing BOOLEAN NOT NULL DEFAULT FALSE,
  healing_details TEXT,
  holy_spirit_baptism BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX journeys_owner_user_id_idx ON journeys(owner_user_id);
CREATE INDEX journeys_owner_email_idx ON journeys(lower(owner_email));

CREATE TABLE prayer_requests (
  id BIGSERIAL PRIMARY KEY,
  journey_id BIGINT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  request_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX prayer_requests_journey_id_idx ON prayer_requests(journey_id);
