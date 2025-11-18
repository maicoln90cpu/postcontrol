-- Criar tabela para armazenar tentativas de retry de notificações
CREATE TABLE IF NOT EXISTS push_notification_retries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  notification_type TEXT,
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,
  status TEXT DEFAULT 'pending', -- pending, retrying, failed, success
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscar retries pendentes
CREATE INDEX idx_push_retries_next_retry ON push_notification_retries(next_retry_at) 
WHERE status IN ('pending', 'retrying');

-- Index para buscar por usuário
CREATE INDEX idx_push_retries_user ON push_notification_retries(user_id);

-- RLS policies
ALTER TABLE push_notification_retries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admins podem ver todos os retries"
ON push_notification_retries FOR SELECT
TO authenticated
USING (is_master_admin(auth.uid()));

CREATE POLICY "Sistema pode gerenciar retries"
ON push_notification_retries FOR ALL
TO service_role
USING (true)
WITH CHECK (true);