-- Adicionar policy mais permissiva para consultas de eventos via JOIN de posts
-- Esta policy permite que usuários vejam dados de eventos quando acessados via posts

CREATE POLICY "Allow event data for posts queries"
ON public.events 
FOR SELECT
TO authenticated
USING (
  -- Master admins podem ver tudo
  is_master_admin(auth.uid())
  OR
  -- Agency admins podem ver eventos da sua agência
  is_agency_admin_for(agency_id)
  OR
  -- Usuários podem ver eventos se existem posts relacionados que eles podem acessar
  id IN (
    SELECT DISTINCT p.event_id 
    FROM public.posts p
    INNER JOIN public.profiles prof ON prof.agency_id = p.agency_id
    WHERE prof.id = auth.uid()
  )
  OR
  -- Guests podem ver eventos que têm permissão
  is_guest_with_permission(auth.uid(), id, 'viewer'::guest_permission)
);