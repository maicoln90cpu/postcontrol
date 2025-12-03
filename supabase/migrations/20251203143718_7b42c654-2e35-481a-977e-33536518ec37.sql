-- Create function for manual participant approval
CREATE OR REPLACE FUNCTION public.approve_participant_manually(
  p_user_id UUID,
  p_event_id UUID,
  p_approve BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_approve THEN
    UPDATE user_event_goals
    SET 
      manual_approval = true,
      manual_approval_at = now(),
      manual_approval_by = auth.uid(),
      manual_approval_reason = p_reason
    WHERE user_id = p_user_id AND event_id = p_event_id;
  ELSE
    UPDATE user_event_goals
    SET 
      manual_approval = false,
      manual_approval_at = NULL,
      manual_approval_by = NULL,
      manual_approval_reason = NULL
    WHERE user_id = p_user_id AND event_id = p_event_id;
  END IF;
END;
$$;