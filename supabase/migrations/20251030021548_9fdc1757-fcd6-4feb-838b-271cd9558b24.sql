-- Corrigir função sync_profile_agency_id para usar search_path vazio
-- e qualificar todas as referências com schema
CREATE OR REPLACE FUNCTION public.sync_profile_agency_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Atualizar o agency_id no profile quando usuário é adicionado a uma agência
  UPDATE public.profiles
  SET agency_id = NEW.agency_id
  WHERE id = NEW.user_id
  AND agency_id IS NULL; -- Só atualiza se ainda não tem agency_id
  
  RETURN NEW;
END;
$$;