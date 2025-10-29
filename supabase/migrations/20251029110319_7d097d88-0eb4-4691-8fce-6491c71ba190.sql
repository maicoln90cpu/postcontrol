-- Fix RLS policies to properly enforce agency_id isolation
-- This ensures agency admins can only manage their own data

-- 1. Update events policies to verify agency_id on creation
DROP POLICY IF EXISTS "Agency admins can create their events" ON public.events;
CREATE POLICY "Agency admins can create their events"
ON public.events FOR INSERT
WITH CHECK (
  (agency_id IN (
    SELECT id FROM agencies WHERE owner_id = auth.uid()
  ))
  OR is_master_admin(auth.uid())
);

-- 2. Update posts policies to verify agency_id on creation
DROP POLICY IF EXISTS "Agency admins can create their posts" ON public.posts;
CREATE POLICY "Agency admins can create their posts"
ON public.posts FOR INSERT
WITH CHECK (
  (agency_id IN (
    SELECT id FROM agencies WHERE owner_id = auth.uid()
  ))
  OR is_master_admin(auth.uid())
);

-- 3. Ensure all existing events and posts have proper agency_id
-- This updates any orphaned records to match their creator's agency
UPDATE public.events SET agency_id = (
  SELECT agency_id FROM profiles WHERE id = events.created_by
)
WHERE agency_id IS NULL AND created_by IS NOT NULL;

UPDATE public.posts SET agency_id = (
  SELECT agency_id FROM profiles WHERE id = posts.created_by
)
WHERE agency_id IS NULL AND created_by IS NOT NULL;