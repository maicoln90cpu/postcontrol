-- Criar política UPDATE explícita para Agency Admins
CREATE POLICY "Agency admins can update their agency submissions v2"
ON submissions FOR UPDATE
TO authenticated
USING (
  is_current_user_agency_admin() 
  AND agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  is_current_user_agency_admin() 
  AND agency_id = (SELECT agency_id FROM profiles WHERE id = auth.uid())
);

-- Criar política UPDATE explícita para Master Admins
CREATE POLICY "Master admins can update all submissions v2"
ON submissions FOR UPDATE
TO authenticated
USING (is_current_user_master_admin())
WITH CHECK (is_current_user_master_admin());