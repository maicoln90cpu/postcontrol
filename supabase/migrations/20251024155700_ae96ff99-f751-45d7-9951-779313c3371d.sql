-- Adicionar policy para admins atualizarem submissões
CREATE POLICY "Admins podem atualizar submissões"
ON public.submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));