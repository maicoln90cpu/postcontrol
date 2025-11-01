-- ============================================================================
-- FIX: Preencher agency_id em submissions existentes
-- ============================================================================

-- 1. Atualizar submissions que têm post_id (buscar agency_id do post)
UPDATE submissions s
SET agency_id = p.agency_id
FROM posts p
WHERE s.post_id = p.id
  AND s.agency_id IS NULL;

-- 2. Criar trigger para futuras submissões (já existe, mas vamos garantir)
CREATE OR REPLACE FUNCTION public.set_submission_agency_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Buscar agency_id do post
  IF NEW.post_id IS NOT NULL THEN
    SELECT p.agency_id INTO NEW.agency_id
    FROM posts p
    WHERE p.id = NEW.post_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_submission_agency_id ON submissions;

CREATE TRIGGER trigger_set_submission_agency_id
  BEFORE INSERT OR UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_submission_agency_id();