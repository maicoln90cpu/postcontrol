-- Adicionar coluna avatar_url na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL da foto de perfil do usuário armazenada no storage';