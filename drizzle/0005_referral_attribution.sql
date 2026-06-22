ALTER TABLE founding_driver_leads
  ADD COLUMN IF NOT EXISTS referred_by_code TEXT;

CREATE INDEX IF NOT EXISTS idx_founding_driver_referral_code
  ON founding_driver_leads(referral_code);

CREATE INDEX IF NOT EXISTS idx_founding_driver_referred_by_code
  ON founding_driver_leads(referred_by_code);
