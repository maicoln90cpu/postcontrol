-- 1. Índice composto para buscar submissions do usuário por evento
CREATE INDEX IF NOT EXISTS idx_submissions_user_event 
ON submissions (user_id, event_id);

-- 2. Índice composto para contagem por tipo de submission
CREATE INDEX IF NOT EXISTS idx_submissions_user_event_type 
ON submissions (user_id, event_id, submission_type);

-- 3. Índice para posts por evento com deadline (ordenação)
CREATE INDEX IF NOT EXISTS idx_posts_event_deadline 
ON posts (event_id, deadline DESC) 
WHERE post_number > 0;

-- 4. Atualizar estatísticas das tabelas
ANALYZE submissions;
ANALYZE posts;