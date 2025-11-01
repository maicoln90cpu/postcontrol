-- ============================================================================
-- FASE 2: SUBMISSION MANAGEMENT RLS POLICIES
-- ============================================================================

-- 1. submission_comments - Adicionar UPDATE/DELETE para admins
CREATE POLICY "Agency admins can update comments"
ON submission_comments FOR UPDATE
TO authenticated
USING (
  is_current_user_agency_admin()
  AND EXISTS (
    SELECT 1 FROM submissions s
    WHERE s.id = submission_comments.submission_id
      AND s.agency_id = get_current_user_agency_id()
  )
)
WITH CHECK (
  is_current_user_agency_admin()
  AND EXISTS (
    SELECT 1 FROM submissions s
    WHERE s.id = submission_comments.submission_id
      AND s.agency_id = get_current_user_agency_id()
  )
);

CREATE POLICY "Agency admins can delete comments"
ON submission_comments FOR DELETE
TO authenticated
USING (
  is_current_user_agency_admin()
  AND EXISTS (
    SELECT 1 FROM submissions s
    WHERE s.id = submission_comments.submission_id
      AND s.agency_id = get_current_user_agency_id()
  )
);

CREATE POLICY "Master admins can update all comments"
ON submission_comments FOR UPDATE
TO authenticated
USING (is_current_user_master_admin())
WITH CHECK (is_current_user_master_admin());

CREATE POLICY "Master admins can delete all comments"
ON submission_comments FOR DELETE
TO authenticated
USING (is_current_user_master_admin());

-- 2. submission_logs - Adicionar SELECT para agency_admins
CREATE POLICY "Agency admins can view their agency submission logs"
ON submission_logs FOR SELECT
TO authenticated
USING (
  is_current_user_agency_admin()
  AND EXISTS (
    SELECT 1 FROM submissions s
    WHERE s.id = submission_logs.submission_id
      AND s.agency_id = get_current_user_agency_id()
  )
);

-- 3. submission_tags - Adicionar gerenciamento para agency_admins
CREATE POLICY "Agency admins can manage their agency submission tags"
ON submission_tags FOR ALL
TO authenticated
USING (
  is_current_user_agency_admin()
  AND EXISTS (
    SELECT 1 FROM submissions s
    WHERE s.id = submission_tags.submission_id
      AND s.agency_id = get_current_user_agency_id()
  )
)
WITH CHECK (
  is_current_user_agency_admin()
  AND EXISTS (
    SELECT 1 FROM submissions s
    WHERE s.id = submission_tags.submission_id
      AND s.agency_id = get_current_user_agency_id()
  )
);