import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

type UserRole = 'user' | 'agency_admin' | 'master_admin';

interface UseUserRoleQueryReturn {
  roles: UserRole[];
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  isAgencyAdmin: boolean;
  isMasterAdmin: boolean;
}

export const useUserRoleQuery = (): UseUserRoleQueryReturn => {
  const { user } = useAuthStore();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['userRoles', user?.id],
    queryFn: async () => {
      console.log('🔐 [useUserRoleQuery] === INICIANDO FETCH DE ROLES ===');
      console.log('🔐 [useUserRoleQuery] User ID:', user?.id);
      console.log('🔐 [useUserRoleQuery] User Email:', user?.email);

      if (!user) {
        console.warn('⚠️ [useUserRoleQuery] SEM USUÁRIO AUTENTICADO');
        return [];
      }

      // Verificar sessão antes de buscar roles
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔐 [useUserRoleQuery] Session check:', {
        hasSession: !!session,
        sessionError: sessionError?.message || null
      });

      if (!session) {
        console.error('❌ [useUserRoleQuery] SESSÃO INVÁLIDA');
        return [];
      }

      console.log('🔐 [useUserRoleQuery] Buscando roles do user_roles...');
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ [useUserRoleQuery] ERRO ao buscar roles:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return [];
      }

      const fetchedRoles = data?.map(r => r.role as UserRole) || [];
      console.log('✅ [useUserRoleQuery] Roles encontradas:', fetchedRoles);
      console.log('✅ [useUserRoleQuery] isAgencyAdmin:', fetchedRoles.includes('agency_admin'));
      console.log('✅ [useUserRoleQuery] isMasterAdmin:', fetchedRoles.includes('master_admin'));

      return fetchedRoles;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados frescos
    gcTime: 10 * 60 * 1000, // 10 minutos - cache mantido na memória
    refetchOnWindowFocus: false, // Não refetch ao focar janela
    refetchOnReconnect: true, // Refetch ao reconectar internet
  });

  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  return {
    roles,
    loading: isLoading,
    hasRole,
    isAgencyAdmin: roles.includes('agency_admin'),
    isMasterAdmin: roles.includes('master_admin'),
  };
};
