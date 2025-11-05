-- Adicionar políticas para acesso via token em agency_guests

-- Policy 1: Permitir SELECT de convites pendentes ou próprios
CREATE POLICY "Guests can view invite by token"
ON public.agency_guests
FOR SELECT
USING (
  status = 'pending'
  OR (guest_user_id IS NOT NULL AND guest_user_id = auth.uid())
);

-- Policy 2: Permitir UPDATE para aceitar convite
CREATE POLICY "Guests can accept their invite"
ON public.agency_guests
FOR UPDATE
USING (
  status = 'pending'
  AND guest_email = auth.email()
)
WITH CHECK (
  status = 'accepted'
  AND guest_user_id = auth.uid()
  AND guest_email = auth.email()
);