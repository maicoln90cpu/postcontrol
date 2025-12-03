-- Add missing columns for manual approval functionality
ALTER TABLE public.user_event_goals
ADD COLUMN IF NOT EXISTS manual_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS manual_approval_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS manual_approval_by UUID,
ADD COLUMN IF NOT EXISTS manual_approval_reason TEXT;