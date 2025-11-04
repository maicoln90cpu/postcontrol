-- ✅ SECURITY FIX: Habilitar RLS nas tabelas de guest system
ALTER TABLE agency_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_event_permissions ENABLE ROW LEVEL SECURITY;

-- ✅ Políticas para agency_guests
CREATE POLICY "Master admins podem gerenciar todos os convidados"
  ON agency_guests FOR ALL
  USING (is_master_admin(auth.uid()));

CREATE POLICY "Agency admins podem gerenciar convidados de sua agência"
  ON agency_guests FOR ALL
  USING (
    is_current_user_agency_admin() 
    AND agency_id = get_current_user_agency_id()
  );

CREATE POLICY "Convidados podem ver suas próprias informações"
  ON agency_guests FOR SELECT
  USING (guest_user_id = auth.uid());

CREATE POLICY "Convidados podem atualizar suas próprias informações"
  ON agency_guests FOR UPDATE
  USING (guest_user_id = auth.uid())
  WITH CHECK (guest_user_id = auth.uid());

-- ✅ Políticas para guest_audit_log
CREATE POLICY "Master admins podem ver todos os logs"
  ON guest_audit_log FOR SELECT
  USING (is_master_admin(auth.uid()));

CREATE POLICY "Agency admins podem ver logs de sua agência"
  ON guest_audit_log FOR SELECT
  USING (
    is_current_user_agency_admin() 
    AND EXISTS (
      SELECT 1 FROM agency_guests ag
      WHERE ag.id = guest_audit_log.guest_id
        AND ag.agency_id = get_current_user_agency_id()
    )
  );

CREATE POLICY "Sistema pode inserir logs"
  ON guest_audit_log FOR INSERT
  WITH CHECK (true);

-- ✅ Políticas para guest_event_permissions
CREATE POLICY "Master admins podem gerenciar todas as permissões"
  ON guest_event_permissions FOR ALL
  USING (is_master_admin(auth.uid()));

CREATE POLICY "Agency admins podem gerenciar permissões de sua agência"
  ON guest_event_permissions FOR ALL
  USING (
    is_current_user_agency_admin() 
    AND EXISTS (
      SELECT 1 FROM agency_guests ag
      WHERE ag.id = guest_event_permissions.guest_id
        AND ag.agency_id = get_current_user_agency_id()
    )
  );

CREATE POLICY "Convidados podem ver suas próprias permissões"
  ON guest_event_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agency_guests ag
      WHERE ag.id = guest_event_permissions.guest_id
        AND ag.guest_user_id = auth.uid()
    )
  );