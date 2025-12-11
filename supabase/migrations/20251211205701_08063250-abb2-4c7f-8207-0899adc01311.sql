-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can read guest list registrations by ID" ON public.guest_list_registrations;