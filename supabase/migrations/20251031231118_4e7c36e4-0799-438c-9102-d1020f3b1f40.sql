-- ============================================
-- CORREÇÃO DEFINITIVA DAS RLS POLICIES
-- ============================================

-- ETAPA 1: Corrigir função is_agency_admin_of para incluir master_admin
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
      AND ur.role IN ('agency_admin'::public.app_role, 'master_admin'::public.app_role)
  );
$$;

-- ============================================
-- ETAPA 2: EVENTOS - Dropar todas as policies antigas
-- ============================================
DROP POLICY IF EXISTS "Users can view events" ON public.events;
DROP POLICY IF EXISTS "Admins can create events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Convidados podem ver eventos permitidos" ON public.events;
DROP POLICY IF EXISTS "Convidados managers podem atualizar eventos" ON public.events;
DROP POLICY IF EXISTS "select_events_policy" ON public.events;
DROP POLICY IF EXISTS "insert_events_policy" ON public.events;
DROP POLICY IF EXISTS "update_events_policy" ON public.events;
DROP POLICY IF EXISTS "delete_events_policy" ON public.events;

-- ETAPA 3: EVENTOS - Criar policies finais
CREATE POLICY "events_select_policy"
ON public.events FOR SELECT
TO authenticated
USING (
  is_master_admin(auth.uid())
  OR is_agency_admin_of(agency_id)
  OR (id IN (
    SELECT gep.event_id
    FROM guest_event_permissions gep
    JOIN agency_guests ag ON ag.id = gep.guest_id
    WHERE ag.guest_user_id = auth.uid()
      AND ag.status = 'accepted'
      AND now() BETWEEN ag.access_start_date AND ag.access_end_date
  ))
  OR is_active = true
);

CREATE POLICY "events_insert_policy"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (
  is_master_admin(auth.uid())
  OR is_agency_admin_of(agency_id)
);

CREATE POLICY "events_update_policy"
ON public.events FOR UPDATE
TO authenticated
USING (
  is_master_admin(auth.uid())
  OR is_agency_admin_of(agency_id)
  OR is_guest_with_permission(auth.uid(), id, 'manager'::guest_permission)
);

CREATE POLICY "events_delete_policy"
ON public.events FOR DELETE
TO authenticated
USING (
  is_master_admin(auth.uid())
  OR is_agency_admin_of(agency_id)
);

-- ============================================
-- ETAPA 4: POSTS - Dropar todas as policies antigas
-- ============================================
DROP POLICY IF EXISTS "Users can view posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can create posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can update posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON public.posts;
DROP POLICY IF EXISTS "Convidados podem ver posts dos eventos permitidos" ON public.posts;
DROP POLICY IF EXISTS "Convidados managers podem gerenciar posts" ON public.posts;
DROP POLICY IF EXISTS "select_posts_policy" ON public.posts;
DROP POLICY IF EXISTS "insert_posts_policy" ON public.posts;
DROP POLICY IF EXISTS "update_posts_policy" ON public.posts;
DROP POLICY IF EXISTS "delete_posts_policy" ON public.posts;

-- ETAPA 5: POSTS - Criar policies finais
CREATE POLICY "posts_select_policy"
ON public.posts FOR SELECT
TO authenticated
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

CREATE POLICY "posts_insert_policy"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (
  is_master_admin(auth.uid())
  OR is_agency_admin_of(agency_id)
  OR is_guest_with_permission(auth.uid(), event_id, 'manager'::guest_permission)
);

CREATE POLICY "posts_update_policy"
ON public.posts FOR UPDATE
TO authenticated
USING (
  is_master_admin(auth.uid())
  OR is_agency_admin_of(agency_id)
  OR is_guest_with_permission(auth.uid(), event_id, 'manager'::guest_permission)
);

CREATE POLICY "posts_delete_policy"
ON public.posts FOR DELETE
TO authenticated
USING (
  is_master_admin(auth.uid())
  OR is_agency_admin_of(agency_id)
  OR is_guest_with_permission(auth.uid(), event_id, 'manager'::guest_permission)
);

-- ============================================
-- ETAPA 6: SUBMISSIONS - Dropar todas as policies antigas
-- ============================================
DROP POLICY IF EXISTS "Users can view submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON public.submissions;
DROP POLICY IF EXISTS "Convidados moderadores podem atualizar submissões" ON public.submissions;
DROP POLICY IF EXISTS "Convidados podem ver submissões dos eventos permitidos" ON public.submissions;
DROP POLICY IF EXISTS "Usuários autenticados podem criar submissões" ON public.submissions;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias submissões" ON public.submissions;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias submissões" ON public.submissions;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias submissões" ON public.submissions;
DROP POLICY IF EXISTS "Admins podem deletar submissões" ON public.submissions;
DROP POLICY IF EXISTS "select_submissions_policy" ON public.submissions;
DROP POLICY IF EXISTS "update_submissions_policy" ON public.submissions;

-- ETAPA 7: SUBMISSIONS - Criar policies finais
CREATE POLICY "submissions_select_policy"
ON public.submissions FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR is_master_admin(auth.uid())
  OR is_agency_admin_of(agency_id)
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

CREATE POLICY "submissions_insert_policy"
ON public.submissions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "submissions_update_policy"
ON public.submissions FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR is_master_admin(auth.uid())
  OR is_agency_admin_of(agency_id)
  OR (post_id IN (
    SELECT p.id
    FROM posts p
    WHERE is_guest_with_permission(auth.uid(), p.event_id, 'moderator'::guest_permission)
       OR is_guest_with_permission(auth.uid(), p.event_id, 'manager'::guest_permission)
  ))
);

CREATE POLICY "submissions_delete_policy"
ON public.submissions FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR is_master_admin(auth.uid())
  OR is_agency_admin_of(agency_id)
);