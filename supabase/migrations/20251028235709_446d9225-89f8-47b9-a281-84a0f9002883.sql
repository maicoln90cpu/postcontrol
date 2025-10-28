-- PARTE 1: Adicionar valores ao enum (isso será commitado primeiro)
DO $$ 
BEGIN
  -- Adicionar master_admin se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'master_admin' 
    AND enumtypid = 'public.app_role'::regtype
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'master_admin';
  END IF;
  
  -- Adicionar agency_admin se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'agency_admin' 
    AND enumtypid = 'public.app_role'::regtype
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'agency_admin';
  END IF;
END $$;