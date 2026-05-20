CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL,
  actor_role text NOT NULL,
  actor_wallet text,
  action_type text NOT NULL,
  ride_id text,
  previous_escrow_state text,
  next_escrow_state text,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_ride_id_idx ON audit_log(ride_id);
CREATE INDEX IF NOT EXISTS audit_log_actor_user_id_idx ON audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log(created_at);
