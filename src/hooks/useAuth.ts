import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const { setUser, setSession, setLoading, setIsAgencyAdmin, setIsMasterAdmin, checkAgencyAdminStatus, checkMasterAdminStatus } = useAuthStore();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        setLoading(false); // ✅ Adicionar aqui
        
        if (session?.user) {
          setTimeout(() => {
            checkAgencyAdminStatus();
            checkMasterAdminStatus();
          }, 200); // Aumentar delay para 200ms
        } else {
          // Clear admin status on logout
          setIsAgencyAdmin(false);
          setIsMasterAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setTimeout(() => {
          checkAgencyAdminStatus();
          checkMasterAdminStatus();
        }, 200); // Aumentar delay para 200ms
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setSession, setLoading, setIsAgencyAdmin, setIsMasterAdmin]);

  return useAuthStore();
};
