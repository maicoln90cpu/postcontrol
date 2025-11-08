-- 🆕 SPRINT 3: Normalização de emails para evitar problemas com case-sensitivity

-- 1. Primeiro, normalizar todos os emails existentes para lowercase
UPDATE agency_guests 
SET guest_email = LOWER(TRIM(guest_email))
WHERE guest_email != LOWER(TRIM(guest_email));

-- 2. Normalizar emails na tabela profiles
UPDATE profiles 
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL AND email != LOWER(TRIM(email));

-- 3. Adicionar constraint para garantir que novos emails sejam sempre lowercase
ALTER TABLE agency_guests 
ADD CONSTRAINT guest_email_lowercase 
CHECK (guest_email = LOWER(TRIM(guest_email)));

-- 4. Adicionar constraint similar para profiles (se não existir)
ALTER TABLE profiles 
ADD CONSTRAINT email_lowercase 
CHECK (email IS NULL OR email = LOWER(TRIM(email)));

-- 5. Adicionar índice único case-insensitive para emails de convidados
-- Isso previne duplicatas como "User@example.com" e "user@example.com"
CREATE UNIQUE INDEX IF NOT EXISTS agency_guests_email_unique 
ON agency_guests (LOWER(TRIM(guest_email)), agency_id)
WHERE status != 'revoked';

-- Log das mudanças
DO $$
BEGIN
  RAISE NOTICE '✅ Emails normalizados para lowercase';
  RAISE NOTICE '✅ Constraints adicionados para validação';
  RAISE NOTICE '✅ Índice único case-insensitive criado';
END $$;