-- Adicionar ON DELETE CASCADE na foreign key de profiles para auth.users
-- Isso garante que quando um usuário é deletado, seu profile também será deletado automaticamente

-- Primeiro, remover a constraint existente se houver
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Adicionar novamente com CASCADE
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;