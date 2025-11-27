-- Adicionar coluna price_types como array para suportar múltiplas seleções
ALTER TABLE guest_list_dates 
ADD COLUMN price_types TEXT[] DEFAULT ARRAY['entry_only'];

-- Migrar dados existentes de price_type para price_types
UPDATE guest_list_dates 
SET price_types = ARRAY[COALESCE(price_type, 'entry_only')]
WHERE price_types IS NULL OR price_types = ARRAY['entry_only'];

-- Comentário: mantendo price_type temporariamente para compatibilidade durante transição
COMMENT ON COLUMN guest_list_dates.price_types IS 'Tipos de valor do evento (pode ter múltiplos): entry_only, consumable_only, entry_plus_half, entry_plus_full';