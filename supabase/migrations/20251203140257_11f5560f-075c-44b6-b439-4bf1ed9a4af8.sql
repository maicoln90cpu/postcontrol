-- 1. DROP da função existente para permitir alterar o tipo de retorno
DROP FUNCTION IF EXISTS public.get_event_available_slots(uuid);

-- 2. Criar nova versão da função com campos adicionais
CREATE OR REPLACE FUNCTION public.get_event_available_slots(p_event_id uuid)
RETURNS TABLE(
  total_slots integer, 
  occupied_slots integer, 
  available_slots integer, 
  occupancy_percentage numeric, 
  total_participants integer,
  goal_achieved_count integer,
  manual_approved_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(e.numero_de_vagas, 0) as total_slots,
    -- Vagas ocupadas = goal_achieved OU manual_approval (excluindo withdrawn)
    COALESCE(COUNT(DISTINCT ueg.user_id) FILTER (
      WHERE (ueg.goal_achieved = true OR ueg.manual_approval = true) 
        AND COALESCE(ueg.participation_status, 'active') != 'withdrawn'
    ), 0)::INTEGER as occupied_slots,
    -- Vagas disponíveis
    GREATEST(0, COALESCE(e.numero_de_vagas, 0) - COALESCE(COUNT(DISTINCT ueg.user_id) FILTER (
      WHERE (ueg.goal_achieved = true OR ueg.manual_approval = true) 
        AND COALESCE(ueg.participation_status, 'active') != 'withdrawn'
    ), 0)::INTEGER) as available_slots,
    -- Percentual de ocupação
    CASE 
      WHEN COALESCE(e.numero_de_vagas, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(COUNT(DISTINCT ueg.user_id) FILTER (
        WHERE (ueg.goal_achieved = true OR ueg.manual_approval = true) 
          AND COALESCE(ueg.participation_status, 'active') != 'withdrawn'
      ), 0)::NUMERIC / NULLIF(e.numero_de_vagas, 0)) * 100, 2)
    END as occupancy_percentage,
    -- Total de participantes (excluindo withdrawn)
    COALESCE(COUNT(DISTINCT ueg.user_id) FILTER (
      WHERE COALESCE(ueg.participation_status, 'active') != 'withdrawn'
    ), 0)::INTEGER as total_participants,
    -- Contagem de quem bateu meta técnica
    COALESCE(COUNT(DISTINCT ueg.user_id) FILTER (
      WHERE ueg.goal_achieved = true 
        AND COALESCE(ueg.participation_status, 'active') != 'withdrawn'
    ), 0)::INTEGER as goal_achieved_count,
    -- Contagem de aprovados manualmente (que NÃO bateram meta)
    COALESCE(COUNT(DISTINCT ueg.user_id) FILTER (
      WHERE ueg.manual_approval = true 
        AND ueg.goal_achieved = false
        AND COALESCE(ueg.participation_status, 'active') != 'withdrawn'
    ), 0)::INTEGER as manual_approved_count
  FROM events e
  LEFT JOIN user_event_goals ueg ON ueg.event_id = e.id
  WHERE e.id = p_event_id
  GROUP BY e.id, e.numero_de_vagas;
END;
$$;

-- 3. DROP e recriar função de ranking com novos campos
DROP FUNCTION IF EXISTS public.get_top_promoters_ranking(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_top_promoters_ranking(p_event_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(
  user_id uuid, 
  full_name text, 
  avatar_url text, 
  current_posts integer, 
  current_sales integer, 
  required_posts integer, 
  required_sales integer, 
  completion_percentage numeric, 
  goal_achieved boolean, 
  rank integer, 
  achieved_requirement_id uuid,
  manual_approval boolean,
  manual_approval_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH rankings AS (
    SELECT 
      ueg.user_id,
      p.full_name,
      p.avatar_url,
      ueg.current_posts,
      ueg.current_sales,
      ueg.required_posts,
      ueg.required_sales,
      CASE 
        WHEN (ueg.required_posts + ueg.required_sales) = 0 THEN 0
        ELSE ROUND(
          ((ueg.current_posts::NUMERIC + ueg.current_sales::NUMERIC) / 
           (ueg.required_posts::NUMERIC + ueg.required_sales::NUMERIC) * 100)::NUMERIC, 
          2
        )
      END as completion_pct,
      ueg.goal_achieved,
      ROW_NUMBER() OVER (
        ORDER BY 
          ueg.goal_achieved DESC,
          ueg.manual_approval DESC,
          (ueg.current_posts + ueg.current_sales) DESC
      )::INTEGER as rank_num,
      ueg.achieved_requirement_id,
      ueg.manual_approval,
      ueg.manual_approval_reason
    FROM user_event_goals ueg
    JOIN profiles p ON p.id = ueg.user_id
    WHERE ueg.event_id = p_event_id
      AND COALESCE(ueg.participation_status, 'active') != 'withdrawn'
  )
  SELECT * FROM rankings
  WHERE rank_num <= p_limit
  ORDER BY rank_num;
END;
$$;