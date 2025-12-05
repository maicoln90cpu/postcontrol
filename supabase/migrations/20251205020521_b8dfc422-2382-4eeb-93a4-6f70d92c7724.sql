-- Inserir configuração padrão de timezone do sistema
INSERT INTO admin_settings (setting_key, setting_value)
VALUES ('system_timezone', 'America/Sao_Paulo')
ON CONFLICT DO NOTHING;