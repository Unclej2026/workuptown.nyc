-- Run this in your Supabase SQL editor
-- Dashboard → SQL Editor → New query → paste & run

CREATE TABLE registrations (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  month_key      text NOT NULL,
  first_name     text NOT NULL,
  last_name      text NOT NULL,
  email          text NOT NULL,
  profession     text NOT NULL,
  neighborhood   text NOT NULL,
  heard_from     text,
  member_interest boolean DEFAULT false,
  registered_at  timestamptz DEFAULT now()
);

-- Index for fast lookups by month
CREATE INDEX idx_registrations_month ON registrations(month_key);

-- Prevent duplicate emails per month
CREATE UNIQUE INDEX idx_registrations_email_month ON registrations(email, month_key);

-- Row Level Security: allow public reads (directory) and inserts (registration)
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view registrations"
  ON registrations FOR SELECT
  USING (true);

CREATE POLICY "Public can register"
  ON registrations FOR INSERT
  WITH CHECK (true);
