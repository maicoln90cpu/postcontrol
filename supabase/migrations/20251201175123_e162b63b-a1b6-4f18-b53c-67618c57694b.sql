-- Create function to update participation status
CREATE OR REPLACE FUNCTION update_participation_status(
  p_user_id UUID,
  p_event_id UUID,
  p_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE user_event_goals
  SET 
    participation_status = p_status,
    withdrawn_at = CASE WHEN p_status = 'withdrawn' THEN NOW() ELSE NULL END,
    withdrawn_by = CASE WHEN p_status = 'withdrawn' THEN auth.uid() ELSE NULL END,
    withdrawn_reason = CASE WHEN p_status = 'withdrawn' THEN p_reason ELSE NULL END,
    updated_at = NOW()
  WHERE user_id = p_user_id 
    AND event_id = p_event_id;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Participant not found for this event';
  END IF;
END;
$$;