-- Fix Security Issue 1: Make reports bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'reports';

-- Add RLS policies for reports bucket
CREATE POLICY "Admins can view reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'reports' 
  AND (
    public.is_master_admin(auth.uid())
    OR public.has_role(auth.uid(), 'agency_admin'::public.app_role)
  )
);

CREATE POLICY "Admins can upload reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reports'
  AND (
    public.is_master_admin(auth.uid())
    OR public.has_role(auth.uid(), 'agency_admin'::public.app_role)
  )
);

CREATE POLICY "Admins can delete reports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'reports'
  AND (
    public.is_master_admin(auth.uid())
    OR public.has_role(auth.uid(), 'agency_admin'::public.app_role)
  )
);

-- Fix Security Issue 2: Drop and recreate user_sales_stats view without SECURITY DEFINER
-- and add RLS policies
DROP VIEW IF EXISTS public.user_sales_stats CASCADE;

CREATE VIEW public.user_sales_stats AS
SELECT 
  user_id,
  count(*) FILTER (WHERE submission_type = 'sale' AND status = 'approved') AS approved_sales_count,
  count(*) FILTER (WHERE submission_type = 'sale') AS total_sales_count
FROM public.submissions
GROUP BY user_id;

-- Enable RLS on the view
ALTER VIEW public.user_sales_stats SET (security_invoker = true);

-- Add comment explaining the view is security invoker
COMMENT ON VIEW public.user_sales_stats IS 'Sales statistics per user. Uses security_invoker=true to respect RLS policies on underlying submissions table.';