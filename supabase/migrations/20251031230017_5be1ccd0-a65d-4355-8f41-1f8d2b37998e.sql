-- ========================================
-- CORREÇÃO CRÍTICA: RLS POLICIES PARA AGENCY ADMINS
-- ========================================

-- ETAPA 1: Adicionar agency_id em submissions (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.submissions ADD COLUMN agency_id UUID REFERENCES public.agencies(id);
    
    -- Preencher agency_id baseado no post
    UPDATE public.submissions s
    SET agency_id = p.agency_id
    FROM public.posts p
    WHERE s.post_id = p.id AND s.agency_id IS NULL;
  END IF;
END $$;

-- ETAPA 2: Criar função helper para verificar se usuário é admin da agência
CREATE OR REPLACE FUNCTION public.is_agency_admin_of(agency_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
      AND p.agency_id = agency_uuid
      AND ur.role = 'agency_admin'::public.app_role
  );
$$;

-- ETAPA 3: Corrigir RLS Policies de EVENTS
DROP POLICY IF EXISTS "Everyone can view active events" ON public.events;
DROP POLICY IF EXISTS "Agency admins can create their events" ON public.events;
DROP POLICY IF EXISTS "Agency admins can update their events" ON public.events;
DROP POLICY IF EXISTS "Agency admins can delete their events" ON public.events;

CREATE POLICY "Users can view events"
ON public.events FOR SELECT
USING (
  -- Master admin vê tudo
  is_master_admin(auth.uid())
  -- Agency admin vê eventos da sua agência
  OR is_agency_admin_of(agency_id)
  -- Guests veem eventos permitidos
  OR (id IN (
    SELECT gep.event_id
    FROM guest_event_permissions gep
    JOIN agency_guests ag ON ag.id = gep.guest_id
    WHERE ag.guest_user_id = auth.uid()
      AND ag.status = 'accepted'
      AND now() BETWEEN ag.access_start_date AND ag.access_end_date
  ))
  -- Eventos ativos são públicos
  OR is_active = true
);

CREATE POLICY "Admins can create events"
ON public.events FOR INSERT
WITH CHECK (
  is_master_admin(auth.uid()) 
  OR is_agency_admin_of(agency_id)
);

CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE
USING (
  is_master_admin(auth.uid()) 
  OR is_agency_admin_of(agency_id)
  OR is_guest_with_permission(auth.uid(), id, 'manager'::guest_permission)
);

CREATE POLICY "Admins can delete events"
ON public.events FOR DELETE
USING (
  is_master_admin(auth.uid()) 
  OR is_agency_admin_of(agency_id)
);

-- ETAPA 4: Corrigir RLS Policies de POSTS
DROP POLICY IF EXISTS "Users can view posts from events" ON public.posts;
DROP POLICY IF EXISTS "Agency admins can create their posts" ON public.posts;
DROP POLICY IF EXISTS "Agency admins can update their posts" ON public.posts;
DROP POLICY IF EXISTS "Agency admins can delete their posts" ON public.posts;

CREATE POLICY "Users can view posts"
ON public.posts FOR SELECT
USING (
  is_master_admin(auth.uid())
  OR is_agency_admin_of(agency_id)
  OR (event_id IN (
    SELECT gep.event_id
    FROM guest_event_permissions gep
    JOIN agency_guests ag ON ag.id = gep.guest_id
    WHERE ag.guest_user_id = auth.uid()
      AND ag.status = 'accepted'
      AND now() BETWEEN ag.access_start_date AND ag.access_end_date
  ))
  OR (EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = posts.event_id AND e.is_active = true
  ))
);

CREATE POLICY "Admins can create posts"
ON public.posts FOR INSERT
WITH CHECK (
  is_master_admin(auth.uid())
  OR is_agency_admin_of(agency_id)
  OR is_guest_with_permission(auth.uid(), event_id, 'manager'::guest_permission)
);

CREATE POLICY "Admins can update posts"
ON public.posts FOR UPDATE
USING (
  is_master_admin(auth.uid())
  OR is_agency_admin_of(agency_id)
  OR is_guest_with_permission(auth.uid(), event_id, 'manager'::guest_permission)
);

CREATE POLICY "Admins can delete posts"
ON public.posts FOR DELETE
USING (
  is_master_admin(auth.uid())
  OR is_agency_admin_of(agency_id)
  OR is_guest_with_permission(auth.uid(), event_id, 'manager'::guest_permission)
);

-- ETAPA 5: Corrigir RLS Policies de SUBMISSIONS
DROP POLICY IF EXISTS "Admins podem ver todas as submissões" ON public.submissions;
DROP POLICY IF EXISTS "Admins podem atualizar submissões" ON public.submissions;
DROP POLICY IF EXISTS "Master admins podem ver todas as submissões" ON public.submissions;
DROP POLICY IF EXISTS "Master admins podem atualizar submissões" ON public.submissions;

CREATE POLICY "Users can view submissions"
ON public.submissions FOR SELECT
USING (
  -- Próprio usuário vê suas submissões
  auth.uid() = user_id
  -- Master admin vê tudo
  OR is_master_admin(auth.uid())
  -- Agency admin vê submissões da agência
  OR is_agency_admin_of(agency_id)
  -- Guests veem submissões dos eventos permitidos
  OR (post_id IN (
    SELECT p.id
    FROM posts p
    JOIN guest_event_permissions gep ON gep.event_id = p.event_id
    JOIN agency_guests ag ON ag.id = gep.guest_id
    WHERE ag.guest_user_id = auth.uid()
      AND ag.status = 'accepted'
      AND now() BETWEEN ag.access_start_date AND ag.access_end_date
  ))
);

CREATE POLICY "Admins can update submissions"
ON public.submissions FOR UPDATE
USING (
  is_master_admin(auth.uid())
  OR is_agency_admin_of(agency_id)
  OR (post_id IN (
    SELECT p.id
    FROM posts p
    WHERE is_guest_with_permission(auth.uid(), p.event_id, 'moderator'::guest_permission)
       OR is_guest_with_permission(auth.uid(), p.event_id, 'manager'::guest_permission)
  ))
  OR auth.uid() = user_id
);

-- ETAPA 6: Trigger para auto-preencher agency_id em submissions
CREATE OR REPLACE FUNCTION public.set_submission_agency_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Buscar agency_id do post
  SELECT p.agency_id INTO NEW.agency_id
  FROM posts p
  WHERE p.id = NEW.post_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_submission_agency_id_trigger ON public.submissions;
CREATE TRIGGER set_submission_agency_id_trigger
  BEFORE INSERT ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_submission_agency_id();