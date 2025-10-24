-- Adicionar coluna is_active na tabela events
ALTER TABLE public.events
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;