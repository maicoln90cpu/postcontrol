-- ============================================================================
-- FIX: Remove circular dependencies causing infinite recursion in RLS
-- ============================================================================

-- EVENTS: Drop policy that queries posts table (causes recursion)
DROP POLICY IF EXISTS "Allow event data for posts queries" ON public.events;

-- POSTS: Drop policy that queries events table (causes recursion)
DROP POLICY IF EXISTS "Anyone can view posts from active events" ON public.posts;

-- ============================================================================
-- Policies que permanecem funcionais (sem recursão):
-- ============================================================================
-- EVENTS: 
-- ✅ "Master admins can view all events" 
-- ✅ "Agency admins can view their agency events"
-- ✅ "Guests can view permitted events"
-- ✅ "Anyone can view active events" (direto, sem JOIN)
--
-- POSTS:
-- ✅ "Master admins can view all posts"
-- ✅ "Agency admins can view their agency posts"  
-- ✅ "Guests can view permitted posts"
-- ============================================================================