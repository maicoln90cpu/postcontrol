-- Adicionar policy para permitir que admins deletem submissões
CREATE POLICY "Admins podem deletar submissões"
ON public.submissions
FOR DELETE
USING (
  has_role(auth.uid(), 'agency_admin'::app_role) OR 
  is_master_admin(auth.uid())
);