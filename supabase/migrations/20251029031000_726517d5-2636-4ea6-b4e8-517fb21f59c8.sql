-- Permitir que qualquer pessoa veja agências para acesso público em /agency/:slug
CREATE POLICY "Public can view agencies by slug"
ON public.agencies
FOR SELECT
USING (true);