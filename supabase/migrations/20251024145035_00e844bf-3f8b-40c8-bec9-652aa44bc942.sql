-- Adicionar campos setor e numero_de_vagas à tabela events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS setor TEXT,
ADD COLUMN IF NOT EXISTS numero_de_vagas INTEGER;