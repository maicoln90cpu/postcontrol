-- Criar tabela de comentários em submissões
CREATE TABLE IF NOT EXISTS public.submission_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.submission_comments ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os comentários
CREATE POLICY "Admins podem ver todos os comentários"
ON public.submission_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Usuários podem ver comentários não internos em suas próprias submissões
CREATE POLICY "Usuários podem ver comentários em suas submissões"
ON public.submission_comments
FOR SELECT
USING (
  is_internal = false AND EXISTS (
    SELECT 1 FROM public.submissions
    WHERE submissions.id = submission_comments.submission_id
    AND submissions.user_id = auth.uid()
  )
);

-- Admins podem criar comentários
CREATE POLICY "Admins podem criar comentários"
ON public.submission_comments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Usuários podem criar comentários em suas próprias submissões
CREATE POLICY "Usuários podem criar comentários em suas submissões"
ON public.submission_comments
FOR INSERT
WITH CHECK (
  is_internal = false AND EXISTS (
    SELECT 1 FROM public.submissions
    WHERE submissions.id = submission_comments.submission_id
    AND submissions.user_id = auth.uid()
  )
);

-- Criar índices para performance
CREATE INDEX idx_submission_comments_submission_id ON public.submission_comments(submission_id);
CREATE INDEX idx_submission_comments_user_id ON public.submission_comments(user_id);
CREATE INDEX idx_submission_comments_created_at ON public.submission_comments(created_at DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_submission_comments_updated_at
BEFORE UPDATE ON public.submission_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campo instagram_verified em submissions para cache
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS instagram_verified BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS instagram_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;