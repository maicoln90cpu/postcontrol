-- 1. Adicionar política de leitura pública para registros de lista de convidados
-- Isso permite que a página de confirmação leia o registro recém-criado
CREATE POLICY "Public can view registration by id"
ON public.guest_list_registrations
FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Adicionar política para agencies com eventos de guest list ativos
-- Isso permite que o logo da agência seja exibido na confirmação
CREATE POLICY "Public can view agencies with active guest list"
ON public.agencies
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM guest_list_events 
    WHERE guest_list_events.agency_id = id 
    AND guest_list_events.is_active = true
  )
);