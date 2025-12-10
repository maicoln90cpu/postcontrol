-- Fase 1: Criar RPC para contagem de submissões por usuário em batch
-- Substitui client-side counting por agregação SQL eficiente

CREATE OR REPLACE FUNCTION public.get_user_submission_counts(p_user_ids uuid[])
RETURNS TABLE(user_id uuid, submission_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    s.user_id,
    COUNT(*) as submission_count
  FROM public.submissions s
  WHERE s.user_id = ANY(p_user_ids)
  GROUP BY s.user_id;
$$;