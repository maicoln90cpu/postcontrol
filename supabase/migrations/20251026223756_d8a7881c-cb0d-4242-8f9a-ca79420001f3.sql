-- Criar índices para melhorar performance de queries

-- Índice composto para filtros de submissões (status, post_id, data)
CREATE INDEX IF NOT EXISTS idx_submissions_filters 
ON submissions(status, post_id, submitted_at DESC);

-- Índice para busca de usuários por texto (full-text search)
CREATE INDEX IF NOT EXISTS idx_profiles_search 
ON profiles USING GIN(
  to_tsvector('portuguese', COALESCE(full_name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(instagram, ''))
);

-- Índice para posts por evento e deadline
CREATE INDEX IF NOT EXISTS idx_posts_event_deadline 
ON posts(event_id, deadline);

-- Índice para user_id em submissions (se não existir)
CREATE INDEX IF NOT EXISTS idx_submissions_user_id 
ON submissions(user_id);

-- Índice para event_id em posts
CREATE INDEX IF NOT EXISTS idx_posts_event_id 
ON posts(event_id);

-- Índice para approved_by em submissions
CREATE INDEX IF NOT EXISTS idx_submissions_approved_by 
ON submissions(approved_by) WHERE approved_by IS NOT NULL;