-- ============================================================================
-- FIX FINAL: Eliminar recursão com SECURITY DEFINER functions
-- ============================================================================

-- 1. Criar funções SECURITY DEFINER para evitar recursão em RLS
-- ============================================================================

-- Verificar se usuário atual tem uma role específica
CREATE OR REPLACE FUNCTION public.current_user_has_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  )
$$;

-- Verificar se usuário atual é master admin
CREATE OR REPLACE FUNCTION public.is_current_user_master_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'master_admin'::app_role
  )
$$;

-- Verificar se usuário atual é agency admin
CREATE OR REPLACE FUNCTION public.is_current_user_agency_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('agency_admin'::app_role, 'master_admin'::app_role)
  )
$$;

-- 2. DROPAR policies problemáticas de user_roles
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Master admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Master admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Agency admins can manage their agency roles" ON public.user_roles;

-- 3. RECRIAR policies SEM RECURSÃO usando SECURITY DEFINER functions
-- ============================================================================

-- Política 1: Usuários podem ver suas próprias roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política 2: Master admins podem ver TODAS as roles
CREATE POLICY "Master admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_current_user_master_admin());

-- Política 3: Master admins podem gerenciar TODAS as roles
CREATE POLICY "Master admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_current_user_master_admin());

-- Política 4: Agency admins podem gerenciar roles da SUA agência
CREATE POLICY "Agency admins can manage their agency roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  user_id IN (
    SELECT p.id
    FROM public.profiles p
    WHERE p.agency_id = (
      SELECT agency_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  AND public.is_current_user_agency_admin()
);