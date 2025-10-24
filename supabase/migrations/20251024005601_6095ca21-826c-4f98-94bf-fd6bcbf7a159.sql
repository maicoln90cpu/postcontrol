-- Add new columns to events table
ALTER TABLE public.events
ADD COLUMN event_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN location TEXT,
ADD COLUMN required_posts INTEGER DEFAULT 0,
ADD COLUMN required_sales INTEGER DEFAULT 0;

-- Update events table description to allow null (in case it wasn't)
ALTER TABLE public.events
ALTER COLUMN description DROP NOT NULL;