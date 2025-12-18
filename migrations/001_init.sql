CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE,
  email TEXT,
  username TEXT,
  role TEXT NOT NULL,
  phone_number TEXT,
  profile_image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE drivers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  is_online BOOLEAN DEFAULT FALSE,
  current_location JSONB,
  vehicle_type TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_color TEXT,
  license_plate TEXT,
  license_number TEXT,
  insurance_doc TEXT,
  vehicle_registration TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_airport_licensed BOOLEAN DEFAULT FALSE,
  reputation_score REAL DEFAULT 5.0,
  total_rides INTEGER DEFAULT 0,
  total_earnings REAL DEFAULT 0,
  acceptance_rate REAL DEFAULT 100,
  on_time_rate REAL DEFAULT 100,
  weekly_earnings REAL DEFAULT 0
);

CREATE TABLE rides (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id VARCHAR NOT NULL REFERENCES users(id),
  driver_id VARCHAR REFERENCES users(id),
  status TEXT NOT NULL,
  pickup_location JSONB NOT NULL,
  dropoff_location JSONB NOT NULL,
  estimated_price REAL NOT NULL,
  final_price REAL,
  surge_multiplier REAL DEFAULT 1.0,
  distance REAL,
  duration INTEGER,
  airport_fee REAL DEFAULT 0,
  cashback_amount REAL DEFAULT 0,
  route_hash TEXT,
  gps_proofs JSONB,
  libre_rewards REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  matched_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE badges (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  badge_type TEXT NOT NULL,
  token_id TEXT,
  earned_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE waitlist (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  user_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sos_alerts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id VARCHAR NOT NULL REFERENCES rides(id),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  location JSONB NOT NULL,
  message TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE disputes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id VARCHAR NOT NULL REFERENCES rides(id),
  reporter_id VARCHAR NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  resolution TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE TABLE referrals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id VARCHAR NOT NULL REFERENCES users(id),
  referred_user_id VARCHAR REFERENCES users(id),
  referral_code TEXT NOT NULL UNIQUE,
  reward_amount REAL DEFAULT 5.0,
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE driver_compliance (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id VARCHAR NOT NULL REFERENCES users(id),
  florida_license_number TEXT,
  background_check_status TEXT DEFAULT 'pending',
  background_check_date TIMESTAMP,
  driving_history_status TEXT DEFAULT 'pending',
  sex_offender_registry_check BOOLEAN DEFAULT FALSE,
  last_compliance_review TIMESTAMP,
  next_review_due TIMESTAMP,
  suspension_status TEXT,
  suspension_reason TEXT,
  suspended_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vehicle_compliance (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id VARCHAR NOT NULL REFERENCES users(id),
  vin_number TEXT,
  year_of_manufacture INTEGER,
  vehicle_age_compliant BOOLEAN DEFAULT FALSE,
  inspection_date TIMESTAMP,
  registration_valid BOOLEAN DEFAULT FALSE,
  four_door_compliant BOOLEAN DEFAULT FALSE,
  wheelchair_accessible BOOLEAN DEFAULT FALSE,
  airport_license_eligible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE insurance_validation (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id VARCHAR NOT NULL REFERENCES users(id),
  insurance_carrier TEXT,
  policy_number TEXT,
  expiration_date TIMESTAMP,
  active_coverage_amount REAL,
  online_but_not_matched_amount REAL,
  coverage_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orlando_permit (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id VARCHAR NOT NULL REFERENCES users(id),
  permit_number TEXT UNIQUE,
  business_tax_receipt TEXT,
  permit_status TEXT DEFAULT 'pending',
  permit_expiration_date TIMESTAMP,
  approval_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE airport_operations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id VARCHAR NOT NULL REFERENCES rides(id),
  is_airport_pickup BOOLEAN DEFAULT FALSE,
  is_airport_dropoff BOOLEAN DEFAULT FALSE,
  airport_fee_paid REAL DEFAULT 0,
  city_infrastructure_fee REAL DEFAULT 0,
  paid_to_airport_wallet BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE compliance_audit_log (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id VARCHAR NOT NULL REFERENCES users(id),
  audit_type TEXT NOT NULL,
  audit_result TEXT,
  audit_notes TEXT,
  audited_by VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE driver_photos (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id VARCHAR NOT NULL REFERENCES users(id),
  photo_type TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  photo_hash TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  verification_status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vehicle_photos (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id VARCHAR NOT NULL REFERENCES users(id),
  photo_type TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  photo_hash TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  verification_status TEXT DEFAULT 'pending',
  ocr_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE insurance_documents (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id VARCHAR NOT NULL REFERENCES users(id),
  document_url TEXT NOT NULL,
  document_hash TEXT,
  policy_number TEXT,
  effective_date TIMESTAMP,
  expiration_date TIMESTAMP,
  coverage_amount REAL,
  ocr_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'pending',
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE background_check_documents (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id VARCHAR NOT NULL REFERENCES users(id),
  document_url TEXT NOT NULL,
  document_hash TEXT,
  check_date TIMESTAMP,
  next_review_date TIMESTAMP,
  verification_status TEXT DEFAULT 'pending',
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rider_photos (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id VARCHAR NOT NULL REFERENCES users(id),
  photo_url TEXT NOT NULL,
  photo_hash TEXT,
  liveness_verified BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);





