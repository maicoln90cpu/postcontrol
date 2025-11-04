-- Adicionar política para usuários verem nomes das agências que pertencem
CREATE POLICY "Users can view their associated agencies"
ON agencies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT agency_id 
    FROM user_agencies 
    WHERE user_id = auth.uid()
  )
);