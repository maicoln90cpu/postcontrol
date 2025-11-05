-- ============================================
-- CORREÇÃO 1: Adicionar agency_id em user_segments
-- ============================================

-- Adicionar coluna agency_id
ALTER TABLE public.user_segments 
ADD COLUMN agency_id uuid REFERENCES public.agencies(id);

-- Popular agency_id com base no created_by
UPDATE public.user_segments us
SET agency_id = p.agency_id
FROM public.profiles p
WHERE us.created_by = p.id;

-- Tornar agency_id obrigatório
ALTER TABLE public.user_segments 
ALTER COLUMN agency_id SET NOT NULL;

-- Remover policy antiga problemática
DROP POLICY IF EXISTS "Admins can manage segments" ON public.user_segments;

-- Criar nova policy correta que filtra por agência
CREATE POLICY "Agency admins can manage their agency segments"
ON public.user_segments
FOR ALL
USING (
  is_current_user_agency_admin() 
  AND agency_id = get_current_user_agency_id()
)
WITH CHECK (
  is_current_user_agency_admin() 
  AND agency_id = get_current_user_agency_id()
);

-- ============================================
-- CORREÇÃO 2: Adicionar search_path em funções
-- ============================================

-- Função 1: notify_user_on_status_change
CREATE OR REPLACE FUNCTION public.notify_user_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Função 2: award_progression_badges
CREATE OR REPLACE FUNCTION public.award_progression_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Função 3: cleanup_old_rate_limits
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - INTERVAL '24 hours';
  RETURN NEW;
END;
$function$;

-- Função 4: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Função 5: update_guest_updated_at
CREATE OR REPLACE FUNCTION public.update_guest_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;