-- ITEM 1: Constraint unique composto (agency_id, slug)
-- Permite que agências diferentes tenham eventos com mesmo slug
ALTER TABLE guest_list_events
DROP CONSTRAINT IF EXISTS guest_list_events_slug_key;

ALTER TABLE guest_list_events
ADD CONSTRAINT guest_list_events_agency_slug_unique 
UNIQUE (agency_id, slug);