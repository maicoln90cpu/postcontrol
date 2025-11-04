-- Create request_status enum
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create agency_requests table
CREATE TABLE agency_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_name TEXT NOT NULL,
  agency_slug TEXT NOT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on agency_requests
ALTER TABLE agency_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own requests"
  ON agency_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create requests
CREATE POLICY "Users can create requests"
  ON agency_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Master admins can view all requests
CREATE POLICY "Master admins can view all requests"
  ON agency_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'master_admin'
    )
  );

-- Master admins can update requests
CREATE POLICY "Master admins can update requests"
  ON agency_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'master_admin'
    )
  );

-- Indexes for performance
CREATE INDEX idx_agency_requests_user_id ON agency_requests(user_id);
CREATE INDEX idx_agency_requests_status ON agency_requests(status);

-- Limit 1 pending request per user
CREATE UNIQUE INDEX idx_one_pending_request_per_user 
  ON agency_requests(user_id) 
  WHERE status = 'pending';

-- Modify agencies table to support trial
ALTER TABLE agencies 
  ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_extended BOOLEAN DEFAULT FALSE;

-- Function to verify if agency is in trial
CREATE OR REPLACE FUNCTION is_agency_in_trial(agency_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM agencies
    WHERE id = agency_uuid
      AND subscription_status = 'trial'
      AND NOW() BETWEEN trial_start_date AND trial_end_date
  )
$$;

-- Function to verify if trial expired
CREATE OR REPLACE FUNCTION is_agency_trial_expired(agency_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM agencies
    WHERE id = agency_uuid
      AND subscription_status = 'trial'
      AND NOW() > trial_end_date
  )
$$;