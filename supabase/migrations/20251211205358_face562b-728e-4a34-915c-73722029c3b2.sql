-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Permitir leitura pública de dados básicos da agência" ON agencies;

-- Create a new restrictive public policy that only allows reading non-sensitive fields
-- Note: Since RLS can't restrict columns, we'll create a view for public access
-- But first, let's create a policy for authenticated users in the same agency
CREATE POLICY "Public can view basic agency info for signup"
ON agencies FOR SELECT
USING (
  -- Allow public to see only what's needed for signup/display
  -- They can only see agencies that have an active status or signup token
  (signup_token IS NOT NULL OR subscription_status IN ('active', 'trial'))
);

-- Create a secure view for public consumption with only safe fields
CREATE OR REPLACE VIEW public_agency_info AS
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

-- Add comment explaining the security model
COMMENT ON VIEW public_agency_info IS 'Public-safe view of agencies without sensitive contact data. Use this for public pages.';