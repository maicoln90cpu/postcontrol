-- Adicionar coluna event_slug para eventos individuais
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_slug text;

-- Criar índice único para event_slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_event_slug ON events(event_slug) WHERE event_slug IS NOT NULL;

-- Adicionar constraint para validar formato do slug (lowercase, hífens, sem espaços)
ALTER TABLE events ADD CONSTRAINT check_event_slug_format 
CHECK (event_slug IS NULL OR event_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

-- Comentário explicativo
COMMENT ON COLUMN events.event_slug IS 'Slug único para o evento, usado em URLs públicas como /agencia/:agencySlug/evento/:eventSlug';