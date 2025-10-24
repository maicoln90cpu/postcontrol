import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { sb } from '@/lib/supabaseSafe';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  checkAdminStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAdmin: false });
  },
  checkAdminStatus: async () => {
    const { user } = get();
    if (!user) {
      set({ isAdmin: false });
      return;
    }

    const { data, error } = await sb
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    set({ isAdmin: !error && !!data });
  },
}));
