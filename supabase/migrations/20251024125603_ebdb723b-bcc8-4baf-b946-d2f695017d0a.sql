-- Fix storage RLS policy for event images
CREATE POLICY "Admins podem fazer upload de imagens de eventos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'screenshots' 
  AND (storage.foldername(name))[1] = 'events'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create event_requirements table for multiple requirement combinations
CREATE TABLE IF NOT EXISTS public.event_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  required_posts INTEGER NOT NULL DEFAULT 0,
  required_sales INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_requirements
CREATE POLICY "Todos podem ver requisitos de eventos"
ON public.event_requirements
FOR SELECT
USING (true);

CREATE POLICY "Admins podem criar requisitos"
ON public.event_requirements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins podem atualizar requisitos"
ON public.event_requirements
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins podem deletar requisitos"
ON public.event_requirements
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_event_requirements_updated_at
BEFORE UPDATE ON public.event_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();