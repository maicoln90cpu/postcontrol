-- ============================================================================
-- STEP 1: Create optimized SECURITY DEFINER function for agency admin check
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_agency_admin_for(_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
      AND p.agency_id = _agency_id
      AND ur.role IN ('agency_admin'::public.app_role, 'master_admin'::public.app_role)
  )
$$;

-- ============================================================================
-- STEP 2: Recreate EVENTS policies with optimized structure
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "events_select_policy" ON public.events;
DROP POLICY IF EXISTS "events_insert_policy" ON public.events;
DROP POLICY IF EXISTS "events_update_policy" ON public.events;
DROP POLICY IF EXISTS "events_delete_policy" ON public.events;

-- SELECT - Multiple policies for different cases
CREATE POLICY "Master admins can view all events"
ON public.events FOR SELECT
TO authenticated
USING (public.is_master_admin(auth.uid()));

CREATE POLICY "Agency admins can view their agency events"
ON public.events FOR SELECT
TO authenticated
USING (public.is_agency_admin_for(agency_id));

CREATE POLICY "Guests can view permitted events"
ON public.events FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT gep.event_id
    FROM public.guest_event_permissions gep
    JOIN public.agency_guests ag ON ag.id = gep.guest_id
    WHERE ag.guest_user_id = auth.uid()
      AND ag.status = 'accepted'
      AND now() BETWEEN ag.access_start_date AND ag.access_end_date
  )
);

CREATE POLICY "Anyone can view active events"
ON public.events FOR SELECT
TO authenticated
USING (is_active = true);

-- INSERT Policy
CREATE POLICY "Admins can create events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (
  public.is_master_admin(auth.uid())
  OR public.is_agency_admin_for(agency_id)
);

-- UPDATE Policy
CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE
TO authenticated
USING (
  public.is_master_admin(auth.uid())
  OR public.is_agency_admin_for(agency_id)
  OR public.is_guest_with_permission(auth.uid(), id, 'manager'::public.guest_permission)
);

-- DELETE Policy
CREATE POLICY "Admins can delete events"
ON public.events FOR DELETE
TO authenticated
USING (
  public.is_master_admin(auth.uid())
  OR public.is_agency_admin_for(agency_id)
);

-- ============================================================================
-- STEP 3: Recreate POSTS policies with optimized structure
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_insert_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_update_policy" ON public.posts;
DROP POLICY IF EXISTS "posts_delete_policy" ON public.posts;

-- SELECT - Multiple policies for different cases
CREATE POLICY "Master admins can view all posts"
ON public.posts FOR SELECT
TO authenticated
USING (public.is_master_admin(auth.uid()));

CREATE POLICY "Agency admins can view their agency posts"
ON public.posts FOR SELECT
TO authenticated
USING (public.is_agency_admin_for(agency_id));

CREATE POLICY "Guests can view permitted posts"
ON public.posts FOR SELECT
TO authenticated
USING (
  event_id IN (
    SELECT gep.event_id
    FROM public.guest_event_permissions gep
    JOIN public.agency_guests ag ON ag.id = gep.guest_id
    WHERE ag.guest_user_id = auth.uid()
      AND ag.status = 'accepted'
      AND now() BETWEEN ag.access_start_date AND ag.access_end_date
  )
);

CREATE POLICY "Anyone can view posts from active events"
ON public.posts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = posts.event_id AND e.is_active = true
  )
);

-- INSERT Policy
CREATE POLICY "Admins can create posts"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (
  public.is_master_admin(auth.uid())
  OR public.is_agency_admin_for(agency_id)
  OR public.is_guest_with_permission(auth.uid(), event_id, 'manager'::public.guest_permission)
);

-- UPDATE Policy
CREATE POLICY "Admins can update posts"
ON public.posts FOR UPDATE
TO authenticated
USING (
  public.is_master_admin(auth.uid())
  OR public.is_agency_admin_for(agency_id)
  OR public.is_guest_with_permission(auth.uid(), event_id, 'manager'::public.guest_permission)
);

-- DELETE Policy
CREATE POLICY "Admins can delete posts"
ON public.posts FOR DELETE
TO authenticated
USING (
  public.is_master_admin(auth.uid())
  OR public.is_agency_admin_for(agency_id)
  OR public.is_guest_with_permission(auth.uid(), event_id, 'manager'::public.guest_permission)
);

-- ============================================================================
-- STEP 4: Recreate SUBMISSIONS policies with optimized structure
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "submissions_select_policy" ON public.submissions;
DROP POLICY IF EXISTS "submissions_insert_policy" ON public.submissions;
DROP POLICY IF EXISTS "submissions_update_policy" ON public.submissions;
DROP POLICY IF EXISTS "submissions_delete_policy" ON public.submissions;

-- SELECT - Multiple policies for different cases
CREATE POLICY "Users can view own submissions"
ON public.submissions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Master admins can view all submissions"
ON public.submissions FOR SELECT
TO authenticated
USING (public.is_master_admin(auth.uid()));

CREATE POLICY "Agency admins can view their agency submissions"
ON public.submissions FOR SELECT
TO authenticated
USING (public.is_agency_admin_for(agency_id));

CREATE POLICY "Guests can view permitted submissions"
ON public.submissions FOR SELECT
TO authenticated
USING (
  post_id IN (
    SELECT p.id
    FROM public.posts p
    JOIN public.guest_event_permissions gep ON gep.event_id = p.event_id
    JOIN public.agency_guests ag ON ag.id = gep.guest_id
    WHERE ag.guest_user_id = auth.uid()
      AND ag.status = 'accepted'
      AND now() BETWEEN ag.access_start_date AND ag.access_end_date
  )
);

-- INSERT Policy
CREATE POLICY "Users can create own submissions"
ON public.submissions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE Policies - Multiple for different roles
CREATE POLICY "Users can update own submissions"
ON public.submissions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Master admins can update all submissions"
ON public.submissions FOR UPDATE
TO authenticated
USING (public.is_master_admin(auth.uid()));

CREATE POLICY "Agency admins can update their agency submissions"
ON public.submissions FOR UPDATE
TO authenticated
USING (public.is_agency_admin_for(agency_id));

CREATE POLICY "Guests can update permitted submissions"
ON public.submissions FOR UPDATE
TO authenticated
USING (
  post_id IN (
    SELECT p.id
    FROM public.posts p
    WHERE public.is_guest_with_permission(auth.uid(), p.event_id, 'moderator'::public.guest_permission)
       OR public.is_guest_with_permission(auth.uid(), p.event_id, 'manager'::public.guest_permission)
  )
);

-- DELETE Policies - Multiple for different roles
CREATE POLICY "Users can delete own submissions"
ON public.submissions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Master admins can delete all submissions"
ON public.submissions FOR DELETE
TO authenticated
USING (public.is_master_admin(auth.uid()));

CREATE POLICY "Agency admins can delete their agency submissions"
ON public.submissions FOR DELETE
TO authenticated
USING (public.is_agency_admin_for(agency_id));