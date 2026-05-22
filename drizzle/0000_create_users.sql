-- Bootstrap migration: create core users table before any jobs or ALTER migrations
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text NOT NULL UNIQUE,
  email text NOT NULL,
  username text,
  phone_number text,
  profile_image text,
  role text NOT NULL DEFAULT 'rider',
  wallet_address text UNIQUE,
  wallet_verified_at timestamptz,
  siwe_verified_at timestamptz,
  identity_verified boolean DEFAULT false,
  identity_verified_at timestamptz,
  driver_status text DEFAULT 'unverified',
  auth_provider text,
  created_at timestamptz DEFAULT now()
);
