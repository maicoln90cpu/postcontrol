-- ============================================================================
-- ROLLBACK: Correções de Segurança do Sistema de Convidados
-- ============================================================================

-- Parte 1: Remover função RPC
DROP FUNCTION IF EXISTS public.accept_guest_invite(UUID);

-- Parte 2: Remover policies de agency_guests
DROP POLICY IF EXISTS "Agency admins manage their agency guests" ON public.agency_guests;
DROP POLICY IF EXISTS "Users can view invites sent to their email" ON public.agency_guests;
DROP POLICY IF EXISTS "Users can accept their own invites" ON public.agency_guests;
DROP POLICY IF EXISTS "Master admins manage all guests" ON public.agency_guests;

-- Parte 3: Remover policies de guest_event_permissions
DROP POLICY IF EXISTS "Agency admins manage guest permissions" ON public.guest_event_permissions;
DROP POLICY IF EXISTS "Guests view their own permissions" ON public.guest_event_permissions;
DROP POLICY IF EXISTS "Master admins manage all permissions" ON public.guest_event_permissions;

-- Parte 4: Remover policies de guest_audit_log
DROP POLICY IF EXISTS "Agency admins view their agency audit logs" ON public.guest_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.guest_audit_log;
DROP POLICY IF EXISTS "Master admins view all audit logs" ON public.guest_audit_log;

-- Parte 5: Desabilitar RLS nas 3 tabelas (voltando ao estado original)
ALTER TABLE public.agency_guests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_event_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_audit_log DISABLE ROW LEVEL SECURITY;