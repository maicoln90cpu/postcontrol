-- Criar função is_master_admin
CREATE OR REPLACE FUNCTION public.is_master_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'master_admin'
  )
$$;

-- Inserir role master_admin para maicoln90@hotmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'master_admin'::app_role
FROM auth.users
WHERE email = 'maicoln90@hotmail.com'
ON CONFLICT (user_id, role) DO NOTHING;