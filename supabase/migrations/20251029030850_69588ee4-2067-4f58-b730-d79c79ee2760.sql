-- ========================================
-- MIGRAÇÃO: Corrigir vínculos de agências existentes
-- ========================================

-- 1. Vincular owner_id nas agências que já têm admin_email cadastrado
UPDATE agencies
SET owner_id = (
  SELECT au.id 
  FROM auth.users au 
  WHERE au.email = agencies.admin_email
  LIMIT 1
)
WHERE owner_id IS NULL 
  AND admin_email IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM auth.users au 
    WHERE au.email = agencies.admin_email
  );

-- 2. Adicionar role agency_admin para owners de agências
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT owner_id, 'agency_admin'::app_role
FROM agencies
WHERE owner_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Atualizar profiles com agency_id
UPDATE profiles
SET agency_id = agencies.id
FROM agencies
WHERE profiles.id = agencies.owner_id
  AND profiles.agency_id IS NULL;