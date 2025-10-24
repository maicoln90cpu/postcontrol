-- Adicionar campo phone na tabela profiles (não pode ser alterado depois)
ALTER TABLE public.profiles 
ADD COLUMN phone text;

-- Adicionar campos de status e aprovação na tabela submissions
ALTER TABLE public.submissions 
ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN approved_by uuid REFERENCES auth.users(id);

-- Criar índices para melhorar performance das queries
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_submissions_post_id ON public.submissions(post_id);

-- Comentários explicativos
COMMENT ON COLUMN public.profiles.phone IS 'Número de telefone do usuário, não pode ser alterado após o cadastro inicial';
COMMENT ON COLUMN public.submissions.status IS 'Status da submissão: pending (aguardando), approved (aprovado), rejected (rejeitado)';
COMMENT ON COLUMN public.submissions.approved_at IS 'Data e hora em que a submissão foi aprovada ou rejeitada';
COMMENT ON COLUMN public.submissions.approved_by IS 'ID do admin que aprovou ou rejeitou a submissão';