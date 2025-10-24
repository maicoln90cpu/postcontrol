// Temporary wrapper to bypass TypeScript errors while supabase types sync
// This will be removed once the types are properly generated
import { supabase } from '@/integrations/supabase/client';

// Cast to any to bypass type checking temporarily
export const sb = supabase as any;
