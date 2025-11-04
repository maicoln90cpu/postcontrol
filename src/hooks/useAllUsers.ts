import { useQuery } from '@tanstack/react-query';
import { sb } from '@/lib/supabaseSafe';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  gender?: string;
  instagram?: string;
  agency_id?: string;
  created_at: string;
  followers_range?: string;
}

interface UserWithRolesAndStats extends UserProfile {
  roles: string[];
  submission_count: number;
}

interface UseAllUsersParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  roleFilter?: string;
  agencyFilter?: string;
  genderFilter?: string;
}

/**
 * Hook React Query para carregar TODOS os usuários com paginação no backend
 * ✅ Item 6: Migração para React Query
 * ✅ Item 7: Paginação no Backend
 * ✅ Item 8: SELECT específico de colunas
 */
export const useAllUsers = ({
  page = 1,
  pageSize = 20,
  searchTerm = '',
  roleFilter = 'all',
  agencyFilter = 'all',
  genderFilter = 'all'
}: UseAllUsersParams = {}) => {
  return useQuery({
    queryKey: ['allUsers', page, pageSize, searchTerm, roleFilter, agencyFilter, genderFilter],
    queryFn: async (): Promise<{ users: UserWithRolesAndStats[]; totalCount: number }> => {
      console.log('🔄 [useAllUsers] Carregando página:', page, 'Filtros:', { searchTerm, roleFilter, agencyFilter, genderFilter });

      // 🔧 ETAPA 1: Buscar TODOS os usuários que atendem aos filtros (sem paginação ainda)
      let countQuery = sb
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      // Aplicar filtros
      if (searchTerm) {
        const cleanSearch = searchTerm.trim();
        countQuery = countQuery.or(
          `full_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%,instagram.ilike.%${cleanSearch}%`
        );
      }

      if (agencyFilter !== 'all') {
        countQuery = countQuery.eq('agency_id', agencyFilter);
      }

      if (genderFilter !== 'all') {
        countQuery = countQuery.eq('gender', genderFilter);
      }

      // 🔧 ETAPA 2: Se filtro de role está ativo, precisamos buscar TODOS os usuários filtrados primeiro
      // para depois filtrar por role no JavaScript (pois role está em tabela separada)
      if (roleFilter !== 'all') {
        console.log('🔍 [useAllUsers] Filtro de role ativo:', roleFilter, '→ Buscar todos os usuários primeiro');
        
        // Buscar TODOS os perfis (sem paginação) que atendem aos outros filtros
        let allQuery = sb
          .from('profiles')
          .select('id, full_name, email, phone, gender, instagram, agency_id, created_at, followers_range');

        if (searchTerm) {
          const cleanSearch = searchTerm.trim();
          allQuery = allQuery.or(
            `full_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%,instagram.ilike.%${cleanSearch}%`
          );
        }

        if (agencyFilter !== 'all') {
          allQuery = allQuery.eq('agency_id', agencyFilter);
        }

        if (genderFilter !== 'all') {
          allQuery = allQuery.eq('gender', genderFilter);
        }

        const { data: allUsersData, error: allUsersError } = await allQuery.order('created_at', { ascending: false });

        if (allUsersError) throw allUsersError;
        if (!allUsersData || allUsersData.length === 0) {
          return { users: [], totalCount: 0 };
        }

        // Buscar roles de TODOS os usuários
        const allUserIds = allUsersData.map(u => u.id);
        const { data: allRoles } = await sb.from('user_roles').select('user_id, role').in('user_id', allUserIds);

        // Filtrar por role
        const filteredByRole = allUsersData.filter(user => {
          const userRoles = allRoles?.filter(r => r.user_id === user.id).map(r => r.role) || [];
          
          if (roleFilter === 'master_admin') return userRoles.includes('master_admin');
          if (roleFilter === 'agency_admin') return userRoles.includes('agency_admin');
          if (roleFilter === 'user') return userRoles.length === 0 || (!userRoles.includes('master_admin') && !userRoles.includes('agency_admin'));
          return true;
        });

        console.log('✅ [useAllUsers] Filtro de role:', filteredByRole.length, 'usuários encontrados');

        // Agora aplicar paginação nos resultados filtrados
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        const paginatedUsers = filteredByRole.slice(from, to);

        // Buscar submissions apenas dos usuários da página atual
        const pageUserIds = paginatedUsers.map(u => u.id);
        const { data: submissionsData } = await sb.from('submissions').select('user_id').in('user_id', pageUserIds);

        // Montar dados finais
        const usersWithData = paginatedUsers.map(user => {
          const userRoles = allRoles?.filter(r => r.user_id === user.id).map(r => r.role) || [];
          const submissionCount = submissionsData?.filter(s => s.user_id === user.id).length || 0;
          
          return {
            ...user,
            roles: userRoles,
            submission_count: submissionCount
          };
        });

        return {
          users: usersWithData,
          totalCount: filteredByRole.length
        };
      }

      // 🔧 ETAPA 3: Se NÃO há filtro de role, paginação normal no banco
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = sb
        .from('profiles')
        .select('id, full_name, email, phone, gender, instagram, agency_id, created_at, followers_range', 
          { count: 'exact' });

      if (searchTerm) {
        const cleanSearch = searchTerm.trim();
        query = query.or(
          `full_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%,instagram.ilike.%${cleanSearch}%`
        );
      }

      if (agencyFilter !== 'all') {
        query = query.eq('agency_id', agencyFilter);
      }

      if (genderFilter !== 'all') {
        query = query.eq('gender', genderFilter);
      }

      const { data: usersData, error: usersError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      console.log('📊 [useAllUsers] Usuários carregados:', usersData?.length, 'Total:', count);

      if (usersError) throw usersError;
      if (!usersData) return { users: [], totalCount: 0 };

      // Buscar roles e submissions em BATCH
      const userIds = usersData.map(u => u.id);

      const [rolesResult, submissionsResult] = await Promise.all([
        sb.from('user_roles').select('user_id, role').in('user_id', userIds),
        sb.from('submissions').select('user_id').in('user_id', userIds)
      ]);

      // Montar dados finais
      const usersWithData = usersData.map(user => {
        const userRoles = rolesResult.data?.filter(r => r.user_id === user.id).map(r => r.role) || [];
        const submissionCount = submissionsResult.data?.filter(s => s.user_id === user.id).length || 0;
        
        return {
          ...user,
          roles: userRoles,
          submission_count: submissionCount
        };
      });

      return {
        users: usersWithData,
        totalCount: count || 0
      };
    },
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: false
  });
};

/**
 * Hook para carregar agências (usado nos filtros)
 */
export const useAgencies = () => {
  return useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      console.log('🏢 [useAgencies] Carregando agências...');
      
      // ✅ ITEM 8: SELECT específico
      const { data, error } = await sb
        .from('agencies')
        .select('id, name, slug')
        .order('name', { ascending: true });

      if (error) throw error;
      
      console.log('✅ [useAgencies] Agências carregadas:', data?.length);
      return data || [];
    },
    staleTime: 60000, // 1 minuto
  });
};
