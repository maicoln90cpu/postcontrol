-- Adicionar campo instagram ao profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS instagram text;

-- Criar bucket para screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para screenshots
CREATE POLICY "Usuários podem fazer upload de seus screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Screenshots são publicamente visíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'screenshots');

CREATE POLICY "Usuários podem atualizar seus screenshots"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem deletar seus screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);