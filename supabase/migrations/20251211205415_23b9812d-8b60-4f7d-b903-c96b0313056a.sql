-- Fix the security definer view issue by making it SECURITY INVOKER
DROP VIEW IF EXISTS public_agency_info;

CREATE VIEW public_agency_info 
WITH (security_invoker = true) AS
SELECT 
  id,
  name,
  slug,
  logo_url,
  og_image_url,
  instagram_url,
  website_url,
  tickets_group_url,
  whatsapp_group_url
FROM agencies
WHERE signup_token IS NOT NULL 
   OR subscription_status IN ('active', 'trial');

-- Grant access to the view for anon and authenticated users
GRANT SELECT ON public_agency_info TO anon;
GRANT SELECT ON public_agency_info TO authenticated;

COMMENT ON VIEW public_agency_info IS 'Public-safe view of agencies without sensitive contact data. Use this for public pages.';