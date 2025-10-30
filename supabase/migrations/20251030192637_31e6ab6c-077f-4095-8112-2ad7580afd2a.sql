-- Item 3: Adicionar campo para URL do grupo WhatsApp
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT;

COMMENT ON COLUMN events.whatsapp_group_url IS 'URL do grupo WhatsApp para divulgação de resultados (seleção de perfil)';