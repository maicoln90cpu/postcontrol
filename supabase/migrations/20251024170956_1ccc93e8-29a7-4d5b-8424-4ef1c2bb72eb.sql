-- Adicionar novos campos à tabela events
ALTER TABLE events 
ADD COLUMN target_gender text[] DEFAULT '{}',
ADD COLUMN require_instagram_link boolean DEFAULT false,
ADD COLUMN internal_notes text;

-- Comentário: 
-- target_gender: Array de gêneros alvo (Feminino, Masculino, LGBTQ+)
-- require_instagram_link: Se true, o campo de link do Instagram aparecerá no formulário de submit
-- internal_notes: Notas internas visíveis apenas para admins