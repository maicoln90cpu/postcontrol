-- Fix 1: Add UUID-based signup tokens to prevent agency enumeration
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS signup_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Generate tokens for existing agencies
UPDATE public.agencies SET signup_token = gen_random_uuid() WHERE signup_token IS NULL;

-- Fix 2: Add screenshot_path column to store file paths instead of expiring URLs
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS screenshot_path TEXT;

-- Migrate existing data: extract path from signed URLs
UPDATE public.submissions 
SET screenshot_path = CASE
  WHEN screenshot_url LIKE '%/screenshots/%' THEN 
    substring(screenshot_url from '/screenshots/(.+?)(\?|$)')
  ELSE NULL
END
WHERE screenshot_path IS NULL AND screenshot_url IS NOT NULL;

-- Make screenshot_url nullable since we'll use screenshot_path going forward
ALTER TABLE public.submissions ALTER COLUMN screenshot_url DROP NOT NULL;