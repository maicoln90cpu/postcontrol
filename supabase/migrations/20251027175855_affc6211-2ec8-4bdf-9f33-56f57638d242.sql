-- FASE 1: SISTEMA DE NOTIFICAÇÕES
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deadline', 'approval', 'rejection', 'badge', 'achievement')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- Habilitar Realtime para notificações
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- RLS para notificações
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger para notificar aprovação/rejeição
CREATE OR REPLACE FUNCTION notify_user_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      '✅ Submissão Aprovada!',
      'Sua postagem foi aprovada. Continue assim!',
      'approval'
    );
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      '❌ Submissão Rejeitada',
      COALESCE('Motivo: ' || NEW.rejection_reason, 'Revise e envie novamente.'),
      'rejection'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_submission_status_change
  AFTER UPDATE OF status ON submissions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_user_on_status_change();

-- FASE 2: BADGES DE PROGRESSÃO
ALTER TABLE user_badges DROP CONSTRAINT IF EXISTS user_badges_badge_type_check;
ALTER TABLE user_badges ADD CONSTRAINT user_badges_badge_type_check 
  CHECK (badge_type IN (
    'first_approval', 
    'streak_5', 
    'event_100', 
    'top_10',
    'bronze_tier',
    'silver_tier',
    'gold_tier',
    'diamond_tier',
    'legend_tier'
  ));

-- Trigger para criar badges de progressão automaticamente
CREATE OR REPLACE FUNCTION award_progression_badges()
RETURNS TRIGGER AS $$
DECLARE
  approved_count INTEGER;
  user_id_var UUID;
BEGIN
  IF NEW.status = 'approved' THEN
    user_id_var := NEW.user_id;
    
    SELECT COUNT(*) INTO approved_count
    FROM submissions
    WHERE user_id = user_id_var AND status = 'approved';
    
    IF approved_count = 5 THEN
      INSERT INTO user_badges (user_id, badge_type) VALUES (user_id_var, 'bronze_tier')
      ON CONFLICT DO NOTHING;
      
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (user_id_var, '🥉 Badge Bronze Conquistado!', 'Você atingiu 5 aprovações!', 'badge');
    ELSIF approved_count = 10 THEN
      INSERT INTO user_badges (user_id, badge_type) VALUES (user_id_var, 'silver_tier')
      ON CONFLICT DO NOTHING;
      
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (user_id_var, '🥈 Badge Prata Conquistado!', 'Você atingiu 10 aprovações!', 'badge');
    ELSIF approved_count = 25 THEN
      INSERT INTO user_badges (user_id, badge_type) VALUES (user_id_var, 'gold_tier')
      ON CONFLICT DO NOTHING;
      
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (user_id_var, '🥇 Badge Ouro Conquistado!', 'Você atingiu 25 aprovações!', 'badge');
    ELSIF approved_count = 50 THEN
      INSERT INTO user_badges (user_id, badge_type) VALUES (user_id_var, 'diamond_tier')
      ON CONFLICT DO NOTHING;
      
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (user_id_var, '💎 Badge Diamante Conquistado!', 'Você atingiu 50 aprovações!', 'badge');
    ELSIF approved_count = 100 THEN
      INSERT INTO user_badges (user_id, badge_type) VALUES (user_id_var, 'legend_tier')
      ON CONFLICT DO NOTHING;
      
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (user_id_var, '🏆 Badge Lenda Conquistado!', 'Você atingiu 100 aprovações!', 'badge');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER award_badges_on_approval
  AFTER UPDATE OF status ON submissions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'approved')
  EXECUTE FUNCTION award_progression_badges();

-- FASE 3: AUTOMAÇÃO DE APROVAÇÕES
CREATE TABLE auto_approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  auto_approve_after_x_approvals INTEGER DEFAULT 5,
  trusted_users UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auto_approval_rules_event ON auto_approval_rules(event_id);

ALTER TABLE auto_approval_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage auto approval rules"
ON auto_approval_rules FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- FASE 4: TEMPLATES DE REJEIÇÃO
CREATE TABLE rejection_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO rejection_templates (title, message) VALUES
  ('Link incorreto', 'O link do Instagram não está correto. Por favor, verifique e reenvie.'),
  ('Imagem ilegível', 'A imagem do print está muito pequena ou ilegível. Tire um print de melhor qualidade.'),
  ('Post errado', 'O post enviado não corresponde ao número solicitado. Verifique o post correto.'),
  ('Fora do prazo', 'O post foi publicado após o prazo limite.'),
  ('Conteúdo inadequado', 'O conteúdo do post não está de acordo com as diretrizes do evento.');

ALTER TABLE rejection_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view rejection templates"
ON rejection_templates FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- FASE 5: STORAGE BUCKET PARA RELATÓRIOS
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can download reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'reports');

CREATE POLICY "Admins can upload reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'reports' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);