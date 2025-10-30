-- Projeto 4: Adicionar tipo de evento (divulgação ou seleção de perfil)
ALTER TABLE events 
ADD COLUMN event_purpose text DEFAULT 'divulgacao' CHECK (event_purpose IN ('divulgacao', 'selecao_perfil'));

-- Projeto 1: Adicionar suporte a vendas e posts
ALTER TABLE events
ADD COLUMN accept_sales boolean DEFAULT false,
ADD COLUMN accept_posts boolean DEFAULT true;

-- Adicionar tipo de submissão e comprovante de venda
ALTER TABLE submissions
ADD COLUMN submission_type text DEFAULT 'post' CHECK (submission_type IN ('post', 'sale')),
ADD COLUMN sales_proof_url text;

-- Criar view para contagem de vendas por usuário
CREATE OR REPLACE VIEW user_sales_stats AS
SELECT 
  s.user_id,
  COUNT(*) FILTER (WHERE s.submission_type = 'sale' AND s.status = 'approved') as approved_sales_count,
  COUNT(*) FILTER (WHERE s.submission_type = 'sale') as total_sales_count
FROM submissions s
GROUP BY s.user_id;

-- Comentários para documentação
COMMENT ON COLUMN events.event_purpose IS 'Tipo do evento: divulgacao ou selecao_perfil';
COMMENT ON COLUMN events.accept_sales IS 'Se o evento aceita comprovantes de venda';
COMMENT ON COLUMN events.accept_posts IS 'Se o evento aceita postagens';
COMMENT ON COLUMN submissions.submission_type IS 'Tipo da submissão: post ou sale';
COMMENT ON COLUMN submissions.sales_proof_url IS 'URL do comprovante de venda (quando submission_type = sale)';