-- Criar tabela system_changelog
CREATE TABLE IF NOT EXISTS public.system_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(20) NOT NULL,
  change_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  affected_modules TEXT[],
  severity VARCHAR(20) DEFAULT 'low',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_changelog_created_at ON public.system_changelog(created_at DESC);
CREATE INDEX idx_changelog_change_type ON public.system_changelog(change_type);
CREATE INDEX idx_changelog_author_id ON public.system_changelog(author_id);

-- RLS Policies
ALTER TABLE public.system_changelog ENABLE ROW LEVEL SECURITY;

-- Master admins podem ver todas as entradas
CREATE POLICY "Master admins can view all changelog entries"
  ON public.system_changelog
  FOR SELECT
  USING (is_master_admin(auth.uid()));

-- Master admins podem inserir entradas
CREATE POLICY "Master admins can insert changelog entries"
  ON public.system_changelog
  FOR INSERT
  WITH CHECK (is_master_admin(auth.uid()));

-- Master admins podem deletar entradas
CREATE POLICY "Master admins can delete changelog entries"
  ON public.system_changelog
  FOR DELETE
  USING (is_master_admin(auth.uid()));

-- Inserir dados iniciais (seed) das implementações recentes
INSERT INTO public.system_changelog (version, change_type, title, description, author_name, affected_modules, severity) VALUES
('v1.2.0', 'improvement', 'Padronização de Gênero no Sistema', 'Convertidos todos os valores "Outro" para "LGBTQ+" no banco de dados. Adicionada constraint CHECK para permitir apenas: Masculino, Feminino, LGBTQ+, Agência ou NULL. Corrigido GENDER_MAP em DashboardStats.tsx para usar valores corretos.', 'AI Assistant', ARRAY['painel_master', 'dashboard_usuario', 'backend'], 'high'),

('v1.2.0', 'bugfix', 'Correção de Scroll Horizontal na Tabela de Usuários', 'Ajustada largura da tabela em AllUsersManagement.tsx para evitar overflow horizontal. Aplicado truncate em células longas e removido whitespace-nowrap em Badges. Tabela agora é totalmente responsiva sem scroll horizontal.', 'AI Assistant', ARRAY['painel_master'], 'medium'),

('v1.2.0', 'feature', 'Exportação XLSX com Link do Instagram', 'Adicionada coluna "Link Instagram" na exportação Excel com URL completa (https://instagram.com/username). Corrigida duplicação de @ na coluna Instagram. Limpeza automática de @ no username.', 'AI Assistant', ARRAY['painel_master'], 'low');