-- Item 3: Campo gender já existe na tabela profiles, apenas garantir que está correto
-- Não precisa alteração no BD

-- Item 5: Corrigir políticas RLS do storage bucket screenshots para permitir upload de imagens de eventos
-- Criar política para agency admins e master admins poderem fazer upload

CREATE POLICY "Agency admins can upload event images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'screenshots' 
  AND (storage.foldername(name))[1] = 'events'
  AND (
    EXISTS (
      SELECT 1 FROM public.agencies
      WHERE owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'master_admin'
    )
  )
);

CREATE POLICY "Agency admins can update event images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'screenshots' 
  AND (storage.foldername(name))[1] = 'events'
  AND (
    EXISTS (
      SELECT 1 FROM public.agencies
      WHERE owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'master_admin'
    )
  )
);

CREATE POLICY "Everyone can view event images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'screenshots' 
  AND (storage.foldername(name))[1] = 'events'
);

-- Item 9: Adicionar campo total_required_posts na tabela events
-- Este campo armazenará o total de postagens obrigatórias para o evento
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS total_required_posts integer DEFAULT 0;

COMMENT ON COLUMN public.events.total_required_posts IS 'Total de postagens obrigatórias que cada divulgador deve fazer no evento';