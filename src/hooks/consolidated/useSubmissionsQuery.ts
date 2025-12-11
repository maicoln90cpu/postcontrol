/**
 * Consolidated Submissions Query Hook
 * ✅ Fase 1: Otimizado com RPC para contagem e cache reduzido
 * 
 * @uses submissionService.getSubmissions
 */

import { useQuery } from '@tanstack/react-query';
import { getSubmissions } from '@/services/submissionService';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface UseSubmissionsQueryParams {
  eventId?: string;
  status?: string;
  postType?: string;
  searchTerm?: string;
  isActive?: boolean;
  postNumber?: number;
  userId?: string;
  agencyId?: string;
  page?: number;
  itemsPerPage?: number;
  enrichProfiles?: boolean;
  enabled?: boolean;
  /** Se true, usa cache curto para painéis de aprovação */
  isAdminPanel?: boolean;
}

/**
 * Hook consolidado para buscar submissões
 * ✅ Fase 1: Usa RPC para contagem em batch (substitui client-side counting)
 * ✅ Fase 1: staleTime reduzido para 30s em painel admin
 */
export const useSubmissionsQuery = ({ 
  eventId,
  status,
  postType,
  searchTerm,
  isActive,
  postNumber,
  userId,
  agencyId,
  page = 1,
  itemsPerPage = 30,
  enrichProfiles = true,
  enabled = true,
  isAdminPanel = false
}: UseSubmissionsQueryParams = {}) => {
  return useQuery({
    queryKey: ['submissions', eventId, status, postType, searchTerm, isActive, postNumber, userId, agencyId, page, itemsPerPage],
    queryFn: async () => {
      logger.time(`[Submissions] Fetch page ${page}`);
      
      const { data: submissions, count, error } = await getSubmissions({
        eventId,
        status,
        postType,
        searchTerm,
        isActive,
        postNumber,
        userId,
        agencyId,
        page,
        itemsPerPage
      });

      logger.timeEnd(`[Submissions] Fetch page ${page}`);
      if (error) throw error;

      // Se enrichProfiles = true, buscar perfis e contagens
      if (enrichProfiles && submissions && submissions.length > 0) {
        logger.time('[Submissions] Enrich Profiles');
        
        const userIds = Array.from(new Set(submissions.map(s => s.user_id)));

        // ✅ FASE 1: Usar RPC para contagem em batch (1 query ao invés de N)
        // ✅ FIX: Filtrar contagem por evento quando eventId está selecionado
        const [profilesData, countsResult] = await Promise.all([
          // Buscar perfis
          supabase
            .from('profiles')
            .select('id, full_name, email, instagram, phone, avatar_url, followers_range')
            .in('id', userIds)
            .then(res => res.data || []),
          
          // ✅ RPC: Contagem em batch via SQL - filtra por evento se selecionado
          supabase
            .rpc('get_user_submission_counts_by_event', { 
              p_user_ids: userIds,
              p_event_id: eventId || null // null = todos os eventos
            })
            .then(res => {
              if (res.error) {
                logger.error('[Submissions] RPC counts error:', res.error);
                return {};
              }
              const counts: Record<string, number> = {};
              res.data?.forEach((row: { user_id: string; submission_count: number }) => {
                counts[row.user_id] = row.submission_count;
              });
              logger.info('[Submissions] User counts loaded:', Object.keys(counts).length, 'eventId:', eventId || 'all');
              return counts;
            })
        ]);
        
        logger.timeEnd('[Submissions] Enrich Profiles');

        // Criar mapa de perfis por ID
        const profilesById: Record<string, any> = {};
        profilesData.forEach(p => { 
          profilesById[p.id] = p; 
        });

        // Enriquecer submissões com perfis e contagens
        const enrichedSubmissions = submissions.map(s => ({
          ...s,
          profiles: profilesById[s.user_id] || null,
          total_submissions: countsResult[s.user_id] || 0,
        }));

        return {
          data: enrichedSubmissions,
          count: count || 0
        };
      }

      return {
        data: submissions || [],
        count: count || 0
      };
    },
    enabled,
    // ✅ FASE 1: Cache otimizado - 30s para painel admin, 5min para outros
    staleTime: isAdminPanel ? 30 * 1000 : 5 * 60 * 1000,
    gcTime: isAdminPanel ? 60 * 1000 : 10 * 60 * 1000,
    // ✅ Refetch quando tab fica ativa (para painel admin)
    refetchOnWindowFocus: isAdminPanel,
    refetchInterval: isAdminPanel ? 30 * 1000 : false,
  });
};

/**
 * Hook para buscar submissões de um usuário específico
 */
export const useUserSubmissionsQuery = (userId: string, agencyId?: string) => {
  return useSubmissionsQuery({ userId, agencyId, enrichProfiles: false });
};

/**
 * Hook para buscar submissões pendentes de uma agência
 */
export const usePendingSubmissionsQuery = (agencyId?: string) => {
  return useSubmissionsQuery({ agencyId, status: 'pending', isAdminPanel: true });
};
