-- Adicionar coluna important_info à tabela guest_list_dates
ALTER TABLE guest_list_dates 
ADD COLUMN important_info TEXT;

COMMENT ON COLUMN guest_list_dates.important_info IS 
  'Informações importantes que a agência quer passar aos usuários (dress code, restrições, etc)';