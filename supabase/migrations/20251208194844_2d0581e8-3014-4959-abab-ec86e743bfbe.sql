-- =====================================================
-- DESATIVAR SISTEMA DE PUSH NOTIFICATIONS
-- Mantém notificações in-app (tabela notifications)
-- Remove apenas triggers síncronos que bloqueiam transações
-- =====================================================

-- 1. Dropar triggers de push na tabela submissions
DROP TRIGGER IF EXISTS trigger_push_submission_approved ON submissions;
DROP TRIGGER IF EXISTS trigger_push_submission_rejected ON submissions;

-- 2. Dropar trigger de push em eventos (notifica todos usuários - muito pesado)
DROP TRIGGER IF EXISTS trigger_push_new_event ON events;

-- 3. Dropar funções de push que fazem HTTP síncrono
DROP FUNCTION IF EXISTS notify_push_submission_approved() CASCADE;
DROP FUNCTION IF EXISTS notify_push_submission_rejected() CASCADE;
DROP FUNCTION IF EXISTS notify_push_new_event() CASCADE;
DROP FUNCTION IF EXISTS send_push_to_user(uuid, text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS send_event_reminders() CASCADE;

-- 4. Comentário para documentação
COMMENT ON TABLE push_subscriptions IS 'SISTEMA DESATIVADO em 2024-12-08 - Push notifications removidas para performance. Tabela mantida para histórico.';
COMMENT ON TABLE notification_logs IS 'SISTEMA DESATIVADO em 2024-12-08 - Push notifications removidas. Apenas notificações in-app ativas.';