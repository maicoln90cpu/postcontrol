-- Sincronizar agency_id dos usuários existentes que estão na tabela user_agencies
-- mas não têm agency_id no profile
UPDATE public.profiles
SET agency_id = user_agencies.agency_id
FROM public.user_agencies
WHERE profiles.id = user_agencies.user_id
AND profiles.agency_id IS NULL;

-- Criar função para sincronizar agency_id quando usuário entra em uma agência
CREATE OR REPLACE FUNCTION public.sync_profile_agency_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Criar trigger para sincronizar agency_id automaticamente
DROP TRIGGER IF EXISTS sync_agency_id_on_user_agency_insert ON public.user_agencies;
CREATE TRIGGER sync_agency_id_on_user_agency_insert
  AFTER INSERT ON public.user_agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_agency_id();