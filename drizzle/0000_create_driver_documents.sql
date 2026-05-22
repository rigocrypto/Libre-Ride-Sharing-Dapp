-- Bootstrap migration: ensure driver_documents exists before ALTERs in 0002
CREATE TABLE IF NOT EXISTS driver_documents (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,

  license_url text,
  insurance_url text,

  license_expires_at timestamptz,
  insurance_expires_at timestamptz,
  inspection_expires_at timestamptz,
  permit_expires_at timestamptz,

  status text DEFAULT 'pending',
  license_status text DEFAULT 'pending',
  insurance_status text DEFAULT 'pending',
  vehicle_inspection_status text DEFAULT 'pending',
  background_check_status text DEFAULT 'pending',
  orlando_permit_status text DEFAULT 'pending',
  airport_eligibility_status text DEFAULT 'pending',

  orlando_permit_number text,
  orlando_permit_expires_at timestamptz,
  mco_airport_eligible boolean DEFAULT false,
  mco_eligibility_granted_at timestamptz,
  background_check_provider text,
  background_check_completed_at timestamptz,

  rejection_reason text,

  uploaded_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  last_reviewed_at timestamptz,
  reviewed_by text,
  next_review_due_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Note: we intentionally avoid adding a foreign key constraint to `users(id)` here
-- so this bootstrap can run reliably on a fresh database regardless of migration ordering.