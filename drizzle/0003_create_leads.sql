CREATE TABLE IF NOT EXISTS founding_driver_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  city text,
  current_apps text[],
  years_driving integer,
  vehicle_type text,
  has_commercial_insurance boolean,
  interested_in_airport boolean,
  notes text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investor_interest_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  lead_type text NOT NULL,
  interest_range text,
  accredited text,
  interest_type text,
  message text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS founding_driver_leads_created_at_idx ON founding_driver_leads(created_at);
CREATE INDEX IF NOT EXISTS investor_interest_leads_created_at_idx ON investor_interest_leads(created_at);
