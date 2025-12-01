ALTER TABLE user_event_goals 
ADD COLUMN IF NOT EXISTS participation_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS withdrawn_by UUID,
ADD COLUMN IF NOT EXISTS withdrawn_reason TEXT