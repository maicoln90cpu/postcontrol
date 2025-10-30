-- Adicionar campo para título customizável do grupo WhatsApp
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS whatsapp_group_title TEXT;

COMMENT ON COLUMN events.whatsapp_group_title IS 'Título customizável para o botão/campo do grupo WhatsApp no formulário de submissão';