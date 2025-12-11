-- Criar RPC para contagem de submissões filtrada por evento
CREATE OR REPLACE FUNCTION public.get_user_submission_counts_by_event(p_user_ids uuid[], p_event_id uuid DEFAULT NULL)
 RETURNS TABLE(user_id uuid, submission_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    s.user_id,
    COUNT(*) as submission_count
  FROM public.submissions s
  WHERE s.user_id = ANY(p_user_ids)
    AND (p_event_id IS NULL OR s.event_id = p_event_id)
  GROUP BY s.user_id;
$function$;