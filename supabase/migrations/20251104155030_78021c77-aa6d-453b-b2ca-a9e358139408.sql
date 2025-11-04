-- Recriar a view sem SECURITY DEFINER (mais segura)
-- A view agora respeitará as permissões RLS do usuário que faz a query
DROP VIEW IF EXISTS agency_requests_with_users;

CREATE VIEW agency_requests_with_users 
WITH (security_invoker = true)
AS
SELECT 
  ar.*,
  p.email,
  p.full_name
FROM agency_requests ar
LEFT JOIN profiles p ON p.id = ar.user_id;