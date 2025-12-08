-- Limpar TODOS os registros da tabela de retry (55k+ linhas, 24MB)
TRUNCATE TABLE push_notification_retries;

-- Remover função de limpeza automática que não será mais necessária
DROP FUNCTION IF EXISTS public.cleanup_old_push_retries();