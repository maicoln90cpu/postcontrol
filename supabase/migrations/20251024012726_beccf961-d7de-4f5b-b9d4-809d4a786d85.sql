-- Adicionar coluna de imagem na tabela events
ALTER TABLE public.events
ADD COLUMN event_image_url TEXT;