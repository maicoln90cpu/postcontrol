-- Adicionar colunas para seleção de perfil na tabela submissions
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS followers_range TEXT,
ADD COLUMN IF NOT EXISTS profile_screenshot_path TEXT;

-- Adicionar colunas de configuração para eventos
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS require_profile_screenshot BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS require_post_screenshot BOOLEAN DEFAULT false;

-- Comentários para documentação
COMMENT ON COLUMN public.submissions.followers_range IS 'Faixa de seguidores: 1-5k, 5-10k, 10k+, 50k+';
COMMENT ON COLUMN public.submissions.profile_screenshot_path IS 'Caminho do print do perfil para seleção de perfil';
COMMENT ON COLUMN public.events.require_profile_screenshot IS 'Se verdadeiro, requer upload do print do perfil';
COMMENT ON COLUMN public.events.require_post_screenshot IS 'Se verdadeiro, requer upload do print de uma postagem';