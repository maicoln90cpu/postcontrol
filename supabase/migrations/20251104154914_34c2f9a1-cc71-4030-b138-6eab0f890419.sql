-- Criar view para agency_requests com dados de usuário
CREATE OR REPLACE VIEW agency_requests_with_users AS
SELECT 
  ar.*,
  p.email,
  p.full_name
FROM agency_requests ar
LEFT JOIN profiles p ON p.id = ar.user_id;

-- Permitir que admins vejam a view
GRANT SELECT ON agency_requests_with_users TO authenticated;