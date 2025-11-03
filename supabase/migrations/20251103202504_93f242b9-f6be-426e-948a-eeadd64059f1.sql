-- Item 6: Adicionar coluna post_type para diferenciar tipos de postagem
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type TEXT;

-- Atualizar posts existentes baseado no event_purpose do evento
UPDATE posts p
SET post_type = e.event_purpose
FROM events e
WHERE p.event_id = e.id
  AND p.post_type IS NULL;

-- Adicionar constraint para garantir valores válidos
ALTER TABLE posts 
  DROP CONSTRAINT IF EXISTS posts_post_type_check;

ALTER TABLE posts 
  ADD CONSTRAINT posts_post_type_check 
  CHECK (post_type IN ('divulgacao', 'venda', 'selecao_perfil'));

-- Adicionar índice para melhorar performance de queries por tipo
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);