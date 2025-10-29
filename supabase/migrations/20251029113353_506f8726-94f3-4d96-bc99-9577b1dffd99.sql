-- Migration: Associar usuários órfãos ao agency_id correto
-- Este script atualiza perfis sem agency_id baseado em suas submissões

-- 1. Atualizar profiles órfãos baseado em suas submissões
UPDATE profiles
SET agency_id = (
  SELECT DISTINCT posts.agency_id 
  FROM submissions 
  INNER JOIN posts ON submissions.post_id = posts.id 
  WHERE submissions.user_id = profiles.id 
    AND posts.agency_id IS NOT NULL
  LIMIT 1
)
WHERE agency_id IS NULL 
  AND id IN (
    SELECT DISTINCT user_id 
    FROM submissions 
    WHERE user_id IS NOT NULL
  );

-- 2. Log para verificar quantos usuários foram atualizados
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM profiles
  WHERE agency_id IS NOT NULL;
  
  RAISE NOTICE 'Total de perfis com agency_id: %', updated_count;
END $$;