-- ================================================
-- FASE 1: MIGRAÇÃO COMPLETA - SISTEMA DE LISTAS VIP
-- ================================================

-- 1. Adicionar campos sociais em agencies
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS tickets_group_url TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS website_url TEXT;

-- 2. Tabela de eventos de lista VIP
CREATE TABLE guest_list_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  extra_info TEXT,
  whatsapp_link TEXT,
  agency_phone TEXT,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de datas/valores do evento
CREATE TABLE guest_list_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES guest_list_events(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  female_price NUMERIC(10,2) NOT NULL,
  male_price NUMERIC(10,2) NOT NULL,
  max_capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de inscrições
CREATE TABLE guest_list_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES guest_list_events(id) ON DELETE CASCADE,
  date_id UUID NOT NULL REFERENCES guest_list_dates(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('feminino', 'masculino', 'outro')),
  ip_address INET,
  user_agent TEXT,
  is_bot_suspected BOOLEAN DEFAULT false,
  shared_via_whatsapp BOOLEAN DEFAULT false,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de analytics
CREATE TABLE guest_list_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES guest_list_events(id) ON DELETE CASCADE,
  date_id UUID REFERENCES guest_list_dates(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'form_start', 'submission', 'share_click')),
  ip_address INET,
  user_agent TEXT,
  utm_params JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Índices para performance
CREATE INDEX idx_guest_list_events_agency ON guest_list_events(agency_id);
CREATE INDEX idx_guest_list_events_slug ON guest_list_events(slug);
CREATE INDEX idx_guest_list_dates_event ON guest_list_dates(event_id);
CREATE INDEX idx_guest_list_registrations_event ON guest_list_registrations(event_id);
CREATE INDEX idx_guest_list_registrations_email ON guest_list_registrations(email);
CREATE INDEX idx_guest_list_analytics_event ON guest_list_analytics(event_id);
CREATE INDEX idx_guest_list_analytics_type ON guest_list_analytics(event_type);
CREATE INDEX idx_guest_list_analytics_created ON guest_list_analytics(created_at);

-- ================================================
-- RLS POLICIES
-- ================================================

-- 7.1 guest_list_events
ALTER TABLE guest_list_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active events"
  ON guest_list_events FOR SELECT
  USING (is_active = true);

CREATE POLICY "Agency admins can manage their events"
  ON guest_list_events FOR ALL
  USING (
    is_current_user_agency_admin() 
    AND agency_id = get_current_user_agency_id()
  )
  WITH CHECK (
    is_current_user_agency_admin() 
    AND agency_id = get_current_user_agency_id()
  );

CREATE POLICY "Master admins can manage all events"
  ON guest_list_events FOR ALL
  USING (is_current_user_master_admin())
  WITH CHECK (is_current_user_master_admin());

-- 7.2 guest_list_dates
ALTER TABLE guest_list_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active dates"
  ON guest_list_dates FOR SELECT
  USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM guest_list_events
      WHERE id = guest_list_dates.event_id AND is_active = true
    )
  );

CREATE POLICY "Agency admins can manage their dates"
  ON guest_list_dates FOR ALL
  USING (
    is_current_user_agency_admin()
    AND EXISTS (
      SELECT 1 FROM guest_list_events
      WHERE id = guest_list_dates.event_id 
      AND agency_id = get_current_user_agency_id()
    )
  )
  WITH CHECK (
    is_current_user_agency_admin()
    AND EXISTS (
      SELECT 1 FROM guest_list_events
      WHERE id = guest_list_dates.event_id 
      AND agency_id = get_current_user_agency_id()
    )
  );

CREATE POLICY "Master admins can manage all dates"
  ON guest_list_dates FOR ALL
  USING (is_current_user_master_admin())
  WITH CHECK (is_current_user_master_admin());

-- 7.3 guest_list_registrations
ALTER TABLE guest_list_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert registrations"
  ON guest_list_registrations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Agency admins can view their registrations"
  ON guest_list_registrations FOR SELECT
  USING (
    is_current_user_agency_admin()
    AND EXISTS (
      SELECT 1 FROM guest_list_events
      WHERE id = guest_list_registrations.event_id 
      AND agency_id = get_current_user_agency_id()
    )
  );

CREATE POLICY "Master admins can view all registrations"
  ON guest_list_registrations FOR SELECT
  USING (is_current_user_master_admin());

CREATE POLICY "Agency admins can export their registrations"
  ON guest_list_registrations FOR UPDATE
  USING (
    is_current_user_agency_admin()
    AND EXISTS (
      SELECT 1 FROM guest_list_events
      WHERE id = guest_list_registrations.event_id 
      AND agency_id = get_current_user_agency_id()
    )
  )
  WITH CHECK (
    is_current_user_agency_admin()
    AND EXISTS (
      SELECT 1 FROM guest_list_events
      WHERE id = guest_list_registrations.event_id 
      AND agency_id = get_current_user_agency_id()
    )
  );

-- 7.4 guest_list_analytics
ALTER TABLE guest_list_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert analytics"
  ON guest_list_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Agency admins can view their analytics"
  ON guest_list_analytics FOR SELECT
  USING (
    is_current_user_agency_admin()
    AND EXISTS (
      SELECT 1 FROM guest_list_events
      WHERE id = guest_list_analytics.event_id 
      AND agency_id = get_current_user_agency_id()
    )
  );

CREATE POLICY "Master admins can view all analytics"
  ON guest_list_analytics FOR SELECT
  USING (is_current_user_master_admin());

-- ================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ================================================

CREATE OR REPLACE FUNCTION update_guest_list_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_guest_list_events_updated_at
  BEFORE UPDATE ON guest_list_events
  FOR EACH ROW
  EXECUTE FUNCTION update_guest_list_events_updated_at();