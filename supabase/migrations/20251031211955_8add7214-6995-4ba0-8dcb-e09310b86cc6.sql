-- =====================================================
-- LOTE 1 - MIGRATION 1: CORRIGIR RLS PROFILES
-- =====================================================
-- Permitir que agency_admin e master_admin editem profiles

-- Remover política restritiva antiga
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;

-- Criar nova política que permite admins editarem
CREATE POLICY "Usuários e admins podem atualizar perfis"
ON public.profiles
FOR UPDATE
USING (
  -- Próprio usuário pode editar seu perfil
  auth.uid() = id
  OR
  -- Agency admins podem editar perfis da sua agência
  (
    has_role(auth.uid(), 'agency_admin'::app_role)
    AND agency_id IN (
      SELECT id FROM public.agencies WHERE owner_id = auth.uid()
    )
  )
  OR
  -- Master admins podem editar qualquer perfil
  is_master_admin(auth.uid())
);

-- =====================================================
-- LOTE 1 - MIGRATION 2: CORRIGIR RLS STORAGE
-- =====================================================

-- Remover todas as políticas antigas conflitantes no bucket screenshots
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Agency admins can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Agency admins can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public can view screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins podem gerenciar screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload de screenshots" ON storage.objects;

-- Criar políticas organizadas e corretas

-- 1. SELECT - Todos podem ver objetos públicos no bucket screenshots
CREATE POLICY "Anyone can view screenshots"
ON storage.objects
FOR SELECT
USING (bucket_id = 'screenshots');

-- 2. INSERT - Usuários autenticados podem fazer upload
CREATE POLICY "Authenticated users can upload to screenshots"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'screenshots'
  AND auth.role() = 'authenticated'
);

-- 3. UPDATE - Usuários podem atualizar seus próprios arquivos
CREATE POLICY "Users can update their own files in screenshots"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. DELETE - Usuários podem deletar seus próprios arquivos
CREATE POLICY "Users can delete their own files in screenshots"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. INSERT/UPDATE para agency logos - Agency admins
CREATE POLICY "Agency admins can manage agency logos"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'screenshots'
  AND name LIKE 'agency-logos/%'
  AND (
    -- Agency admin da agência
    EXISTS (
      SELECT 1 FROM public.agencies
      WHERE id::text = split_part(split_part(name, '/', 2), '_', 1)
      AND owner_id = auth.uid()
    )
    OR
    -- Master admin
    is_master_admin(auth.uid())
  )
)
WITH CHECK (
  bucket_id = 'screenshots'
  AND name LIKE 'agency-logos/%'
  AND (
    EXISTS (
      SELECT 1 FROM public.agencies
      WHERE id::text = split_part(split_part(name, '/', 2), '_', 1)
      AND owner_id = auth.uid()
    )
    OR
    is_master_admin(auth.uid())
  )
);