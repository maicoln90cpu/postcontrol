
-- =====================================================
-- FASE 1: OTIMIZAÇÕES CRÍTICAS DE PERFORMANCE
-- =====================================================

-- 1. REMOVER TRIGGER DUPLICADO (executa mesma função 2x)
-- Mantemos apenas trigger_set_submission_agency_id que roda em INSERT OR UPDATE
DROP TRIGGER IF EXISTS set_submission_agency_id_trigger ON submissions;

-- 2. TORNAR trigger_check_goal_on_approval ASSÍNCRONO
-- Problema: Chamada HTTP síncrona bloqueia transação por 300-500ms
-- Solução: Usar pg_notify para processar assíncronamente

-- Dropar a função antiga que faz HTTP síncrono
DROP FUNCTION IF EXISTS trigger_check_goal_on_approval() CASCADE;

-- Criar nova função que apenas dispara pg_notify (assíncrona)
CREATE OR REPLACE FUNCTION trigger_check_goal_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Só notificar quando status muda para 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Atualizar metas diretamente na função (sem HTTP)
    PERFORM check_and_update_user_goal(NEW.user_id, NEW.event_id);
    
    -- Disparar notificação assíncrona para edge function processar depois
    -- (notificação de meta atingida pode ser processada em background)
    PERFORM pg_notify(
      'goal_check_channel',
      json_build_object(
        'user_id', NEW.user_id,
        'event_id', NEW.event_id,
        'submission_id', NEW.id
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recriar o trigger com a nova função assíncrona
DROP TRIGGER IF EXISTS trigger_check_goal_after_approval ON submissions;
CREATE TRIGGER trigger_check_goal_after_approval
  AFTER INSERT OR UPDATE OF status ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_goal_on_approval();

-- 3. Comentário de documentação
COMMENT ON FUNCTION trigger_check_goal_on_approval() IS 
'OTIMIZADO 2024-12-09: Removida chamada HTTP síncrona. Agora usa check_and_update_user_goal diretamente + pg_notify para notificações em background.';
