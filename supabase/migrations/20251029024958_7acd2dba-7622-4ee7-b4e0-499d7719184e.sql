-- Migration: Garantir que Master Admin pode visualizar todos os dados
-- Este migration garante que todas as políticas RLS incluem permissão para master_admin

-- ========================================
-- PROFILES: Master Admin pode ver todos os perfis
-- ========================================
DROP POLICY IF EXISTS "Master admins podem ver todos os perfis" ON public.profiles;

CREATE POLICY "Master admins podem ver todos os perfis"
ON public.profiles
FOR SELECT
USING (is_master_admin(auth.uid()));

-- ========================================
-- SUBMISSIONS: Master Admin pode ver todas as submissões
-- ========================================
DROP POLICY IF EXISTS "Master admins podem ver todas as submissões" ON public.submissions;

CREATE POLICY "Master admins podem ver todas as submissões"
ON public.submissions
FOR SELECT
USING (is_master_admin(auth.uid()));

DROP POLICY IF EXISTS "Master admins podem atualizar submissões" ON public.submissions;

CREATE POLICY "Master admins podem atualizar submissões"
ON public.submissions
FOR UPDATE
USING (is_master_admin(auth.uid()));

-- ========================================
-- NOTIFICATIONS: Master Admin pode ver todas
-- ========================================
DROP POLICY IF EXISTS "Master admins podem ver todas as notificações" ON public.notifications;

CREATE POLICY "Master admins podem ver todas as notificações"
ON public.notifications
FOR SELECT
USING (is_master_admin(auth.uid()));

-- ========================================
-- USER_BADGES: Master Admin pode ver todos
-- ========================================
DROP POLICY IF EXISTS "Master admins podem ver todas as badges" ON public.user_badges;

CREATE POLICY "Master admins podem ver todas as badges"
ON public.user_badges
FOR SELECT
USING (is_master_admin(auth.uid()));

-- ========================================
-- SUBMISSION_COMMENTS: Master Admin pode ver todos
-- ========================================
DROP POLICY IF EXISTS "Master admins podem ver todos os comentários" ON public.submission_comments;

CREATE POLICY "Master admins podem ver todos os comentários"
ON public.submission_comments
FOR SELECT
USING (is_master_admin(auth.uid()));

DROP POLICY IF EXISTS "Master admins podem criar comentários" ON public.submission_comments;

CREATE POLICY "Master admins podem criar comentários"
ON public.submission_comments
FOR INSERT
WITH CHECK (is_master_admin(auth.uid()));

-- ========================================
-- SUBMISSION_LOGS: Master Admin pode ver todos
-- ========================================
DROP POLICY IF EXISTS "Master admins podem ver todos os logs" ON public.submission_logs;

CREATE POLICY "Master admins podem ver todos os logs"
ON public.submission_logs
FOR SELECT
USING (is_master_admin(auth.uid()));

-- ========================================
-- SUBMISSION_TAGS: Master Admin pode gerenciar todas
-- ========================================
DROP POLICY IF EXISTS "Master admins podem gerenciar todas as tags" ON public.submission_tags;

CREATE POLICY "Master admins podem gerenciar todas as tags"
ON public.submission_tags
FOR ALL
USING (is_master_admin(auth.uid()));

-- ========================================
-- EVENT_REQUIREMENTS: Master Admin pode ver todos
-- ========================================
DROP POLICY IF EXISTS "Master admins podem ver todos os requisitos" ON public.event_requirements;

CREATE POLICY "Master admins podem ver todos os requisitos"
ON public.event_requirements
FOR SELECT
USING (is_master_admin(auth.uid()));

-- ========================================
-- EVENT_FAQS: Master Admin pode gerenciar todos
-- ========================================
DROP POLICY IF EXISTS "Master admins podem gerenciar FAQs" ON public.event_faqs;

CREATE POLICY "Master admins podem gerenciar FAQs"
ON public.event_faqs
FOR ALL
USING (is_master_admin(auth.uid()));

-- ========================================
-- USER_SEGMENTS: Master Admin pode gerenciar todos
-- ========================================
DROP POLICY IF EXISTS "Master admins podem gerenciar segmentos" ON public.user_segments;

CREATE POLICY "Master admins podem gerenciar segmentos"
ON public.user_segments
FOR ALL
USING (is_master_admin(auth.uid()));

-- ========================================
-- AUTO_APPROVAL_RULES: Master Admin pode gerenciar todas
-- ========================================
DROP POLICY IF EXISTS "Master admins podem gerenciar regras de auto-aprovação" ON public.auto_approval_rules;

CREATE POLICY "Master admins podem gerenciar regras de auto-aprovação"
ON public.auto_approval_rules
FOR ALL
USING (is_master_admin(auth.uid()));