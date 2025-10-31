-- Migration: Sync followers_range from submissions to profiles
-- Copiar dados de followers_range das submissions para os perfis que não têm essa informação

UPDATE profiles p
SET followers_range = (
  SELECT s.followers_range 
  FROM submissions s 
  WHERE s.user_id = p.id 
    AND s.followers_range IS NOT NULL 
  ORDER BY s.created_at DESC 
  LIMIT 1
)
WHERE p.followers_range IS NULL
  AND EXISTS (
    SELECT 1 
    FROM submissions s2 
    WHERE s2.user_id = p.id 
      AND s2.followers_range IS NOT NULL
  );