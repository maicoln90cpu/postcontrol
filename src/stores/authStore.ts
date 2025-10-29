import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { sb } from '@/lib/supabaseSafe';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAgencyAdmin: boolean;
  isMasterAdmin: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setIsAgencyAdmin: (isAgencyAdmin: boolean) => void;
  setIsMasterAdmin: (isMasterAdmin: boolean) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  checkAgencyAdminStatus: () => Promise<void>;
  checkMasterAdminStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAgencyAdmin: false,
  isMasterAdmin: false,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setIsAgencyAdmin: (isAgencyAdmin) => set({ isAgencyAdmin }),
  setIsMasterAdmin: (isMasterAdmin) => set({ isMasterAdmin }),
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAgencyAdmin: false, isMasterAdmin: false });
  },
  checkAgencyAdminStatus: async () => {
    const { user } = get();
    if (!user) {
      set({ isAgencyAdmin: false });
      return;
    }

    const { data, error } = await sb
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'agency_admin')
      .maybeSingle();

    set({ isAgencyAdmin: !error && !!data });
  },
  checkMasterAdminStatus: async () => {
    const { user } = get();
    if (!user) {
      set({ isMasterAdmin: false });
      return;
    }

    const { data, error } = await sb
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master_admin')
      .maybeSingle();

    set({ isMasterAdmin: !error && !!data });
  },
}));
