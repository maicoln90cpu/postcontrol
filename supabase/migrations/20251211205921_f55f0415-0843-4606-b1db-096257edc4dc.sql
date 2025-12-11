-- Remove the overly permissive policy that exposes all pending invites
DROP POLICY IF EXISTS "Guests can view invite by token" ON public.agency_guests;

-- Create a more restrictive policy: users can only see invites sent to their own email
CREATE POLICY "Guests can view their own invite by email"
ON public.agency_guests
FOR SELECT
USING (
  -- Authenticated users can see invites sent to their email
  (auth.email() IS NOT NULL AND guest_email = auth.email())
  OR
  -- Or if they've already accepted and linked their user_id
  (guest_user_id IS NOT NULL AND guest_user_id = auth.uid())
);