-- Inserir configuração padrão de domínio customizado se não existir
INSERT INTO admin_settings (setting_key, setting_value)
VALUES ('custom_domain', 'https://projetopost.infoprolab.com.br')
ON CONFLICT (setting_key) DO NOTHING;