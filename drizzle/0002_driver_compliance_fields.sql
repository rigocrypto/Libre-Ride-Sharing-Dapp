ALTER TABLE audit_log
  ALTER COLUMN actor_user_id TYPE text USING actor_user_id::text;

ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS license_expires_at timestamptz;
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS insurance_expires_at timestamptz;
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS inspection_expires_at timestamptz;
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS permit_expires_at timestamptz;
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS license_status text DEFAULT 'pending';
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS insurance_status text DEFAULT 'pending';
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS vehicle_inspection_status text DEFAULT 'pending';
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS background_check_status text DEFAULT 'pending';
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS orlando_permit_status text DEFAULT 'pending';
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS airport_eligibility_status text DEFAULT 'pending';
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS orlando_permit_number text;
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS orlando_permit_expires_at timestamptz;
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS mco_airport_eligible boolean DEFAULT false;
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS mco_eligibility_granted_at timestamptz;
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS background_check_provider text;
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS background_check_completed_at timestamptz;
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz;
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS reviewed_by text;
ALTER TABLE driver_documents ADD COLUMN IF NOT EXISTS next_review_due_at timestamptz;
