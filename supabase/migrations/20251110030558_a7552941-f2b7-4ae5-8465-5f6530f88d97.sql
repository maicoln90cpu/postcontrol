-- ============================================
-- NOTIFICAÇÕES PUSH - INFRAESTRUTURA
-- ============================================

-- 1. Criar tabela de inscrições push
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- 2. Habilitar RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS
CREATE POLICY "Usuários podem gerenciar suas próprias inscrições"
  ON public.push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todas inscrições"
  ON public.push_subscriptions
  FOR SELECT
  USING (is_master_admin(auth.uid()));

-- 4. Índices para performance
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);

-- 5. Função para enviar notificação push via edge function
CREATE OR REPLACE FUNCTION public.send_push_to_user(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Chamar edge function de forma assíncrona
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'userId', p_user_id,
      'title', p_title,
      'body', p_body,
      'data', p_data
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Silenciar erros para não bloquear transações principais
  RAISE WARNING 'Erro ao enviar push notification: %', SQLERRM;
END;
$$;

-- 6. Trigger: Notificar quando submissão for aprovada
CREATE OR REPLACE FUNCTION public.notify_push_submission_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    PERFORM send_push_to_user(
      NEW.user_id,
      '✅ Submissão Aprovada!',
      'Sua postagem foi aprovada. Parabéns!',
      jsonb_build_object(
        'type', 'submission_approved',
        'submissionId', NEW.id,
        'url', '/dashboard'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_push_submission_approved ON public.submissions;
CREATE TRIGGER trigger_push_submission_approved
  AFTER UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_push_submission_approved();

-- 7. Trigger: Notificar quando submissão for rejeitada
CREATE OR REPLACE FUNCTION public.notify_push_submission_rejected()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    PERFORM send_push_to_user(
      NEW.user_id,
      '❌ Submissão Rejeitada',
      COALESCE('Motivo: ' || NEW.rejection_reason, 'Revise sua postagem e tente novamente.'),
      jsonb_build_object(
        'type', 'submission_rejected',
        'submissionId', NEW.id,
        'url', '/dashboard'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_push_submission_rejected ON public.submissions;
CREATE TRIGGER trigger_push_submission_rejected
  AFTER UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_push_submission_rejected();

-- 8. Trigger: Notificar quando novo evento for criado
CREATE OR REPLACE FUNCTION public.notify_push_new_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
BEGIN
  IF NEW.is_active = true THEN
    -- Notificar todos os usuários da agência
    FOR user_record IN 
      SELECT DISTINCT p.id
      FROM profiles p
      WHERE p.agency_id = NEW.agency_id
    LOOP
      PERFORM send_push_to_user(
        user_record.id,
        '🎉 Novo Evento Disponível!',
        NEW.title || ' - Confira agora!',
        jsonb_build_object(
          'type', 'new_event',
          'eventId', NEW.id,
          'url', '/submit'
        )
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_push_new_event ON public.events;
CREATE TRIGGER trigger_push_new_event
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION notify_push_new_event();

-- 9. Função para lembrete de evento (será chamada por cron job)
CREATE OR REPLACE FUNCTION public.send_event_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_record RECORD;
  user_record RECORD;
BEGIN
  -- Buscar eventos que acontecerão em 24 horas
  FOR event_record IN
    SELECT id, title, agency_id, event_date
    FROM events
    WHERE is_active = true
      AND event_date IS NOT NULL
      AND event_date > now()
      AND event_date <= now() + interval '25 hours'
      AND event_date >= now() + interval '23 hours'
  LOOP
    -- Notificar usuários da agência que ainda não submeteram
    FOR user_record IN
      SELECT DISTINCT p.id
      FROM profiles p
      WHERE p.agency_id = event_record.agency_id
        AND NOT EXISTS (
          SELECT 1 FROM submissions s
          JOIN posts po ON po.id = s.post_id
          WHERE po.event_id = event_record.id
            AND s.user_id = p.id
        )
    LOOP
      PERFORM send_push_to_user(
        user_record.id,
        '⏰ Lembrete de Evento',
        event_record.title || ' começa em 24 horas!',
        jsonb_build_object(
          'type', 'event_reminder',
          'eventId', event_record.id,
          'url', '/submit'
        )
      );
    END LOOP;
  END LOOP;
END;
$$;