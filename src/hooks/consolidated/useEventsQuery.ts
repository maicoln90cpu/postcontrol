/**
 * Consolidated Events Query Hook
 * ✅ Sprint 2A: Substitui useEvents de useReactQuery.ts e useAdminQueries.ts
 * ✅ FASE 1 PERFORMANCE: Usa RPC get_events_with_posts para eliminar N+1
 * 
 * @uses RPC get_events_with_posts
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UseEventsQueryParams {
  agencyId?: string;
  isActive?: boolean;
  includePosts?: boolean;
  enabled?: boolean;
}

interface EventFromRPC {
  event_id: string;
  event_title: string;
  event_description: string | null;
  event_date: string | null;
  event_location: string | null;
  event_is_active: boolean;
  event_agency_id: string | null;
  event_created_by: string;
  event_created_at: string;
  event_updated_at: string;
  event_setor: string | null;
  event_numero_de_vagas: number | null;
  event_required_posts: number | null;
  event_required_sales: number | null;
  event_total_required_posts: number | null;
  event_is_approximate_total: boolean | null;
  event_accept_posts: boolean | null;
  event_accept_sales: boolean | null;
  event_event_slug: string | null;
  event_event_image_url: string | null;
  event_event_purpose: string | null;
  event_target_gender: string[] | null;
  event_producer_name: string | null;
  event_ticketer_email: string | null;
  event_internal_notes: string | null;
  event_whatsapp_group_url: string | null;
  event_whatsapp_group_title: string | null;
  event_require_instagram_link: boolean | null;
  event_require_post_screenshot: boolean | null;
  event_require_profile_screenshot: boolean | null;
  event_auto_activate_at: string | null;
  event_auto_deactivate_at: string | null;
  post_id: string | null;
  post_event_id: string | null;
  post_post_number: number | null;
  post_deadline: string | null;
  post_created_by: string | null;
  post_created_at: string | null;
  post_updated_at: string | null;
  post_agency_id: string | null;
  post_post_type: string | null;
}

/**
 * Hook consolidado para buscar eventos
 * ✅ FASE 1: Usa RPC única para buscar eventos + posts (elimina N+1)
 * - Reduz de N+1 queries para 1 única query
 * - Suporta filtros de agência e status ativo
 * - Opcionalmente inclui posts relacionados
 * 
 * @example
 * const { data, isLoading } = useEventsQuery({ 
 *   agencyId: 'abc123', 
 *   isActive: true,
 *   includePosts: true 
 * });
 */
export const useEventsQuery = ({ 
  agencyId, 
  isActive,
  includePosts = false,
  enabled = true 
}: UseEventsQueryParams = {}) => {
  return useQuery({
    queryKey: ['events', agencyId, isActive, includePosts],
    refetchOnMount: true,
    queryFn: async () => {
      // ✅ FASE 1: Usar RPC que retorna eventos + posts em uma única query
      const { data: rawData, error } = await supabase.rpc('get_events_with_posts', {
        p_agency_id: agencyId || null,
        p_is_active: isActive ?? null
      });

      if (error) throw error;

      // Processar dados flat da RPC para estrutura hierárquica
      const eventsMap = new Map<string, any>();
      const postsMap = new Map<string, any[]>();

      (rawData as EventFromRPC[] || []).forEach((row) => {
        // Adicionar evento se ainda não existir
        if (!eventsMap.has(row.event_id)) {
          eventsMap.set(row.event_id, {
            id: row.event_id,
            title: row.event_title,
            description: row.event_description,
            event_date: row.event_date,
            location: row.event_location,
            is_active: row.event_is_active,
            agency_id: row.event_agency_id,
            created_by: row.event_created_by,
            created_at: row.event_created_at,
            updated_at: row.event_updated_at,
            setor: row.event_setor,
            numero_de_vagas: row.event_numero_de_vagas,
            required_posts: row.event_required_posts,
            required_sales: row.event_required_sales,
            total_required_posts: row.event_total_required_posts,
            is_approximate_total: row.event_is_approximate_total,
            accept_posts: row.event_accept_posts,
            accept_sales: row.event_accept_sales,
            event_slug: row.event_event_slug,
            event_image_url: row.event_event_image_url,
            event_purpose: row.event_event_purpose,
            target_gender: row.event_target_gender,
            producer_name: row.event_producer_name,
            ticketer_email: row.event_ticketer_email,
            internal_notes: row.event_internal_notes,
            whatsapp_group_url: row.event_whatsapp_group_url,
            whatsapp_group_title: row.event_whatsapp_group_title,
            require_instagram_link: row.event_require_instagram_link,
            require_post_screenshot: row.event_require_post_screenshot,
            require_profile_screenshot: row.event_require_profile_screenshot,
            auto_activate_at: row.event_auto_activate_at,
            auto_deactivate_at: row.event_auto_deactivate_at,
          });
        }

        // Adicionar post se existir (LEFT JOIN pode retornar null)
        if (row.post_id) {
          if (!postsMap.has(row.event_id)) {
            postsMap.set(row.event_id, []);
          }
          postsMap.get(row.event_id)!.push({
            id: row.post_id,
            event_id: row.post_event_id,
            post_number: row.post_post_number,
            deadline: row.post_deadline,
            created_by: row.post_created_by,
            created_at: row.post_created_at,
            updated_at: row.post_updated_at,
            agency_id: row.post_agency_id,
            post_type: row.post_post_type,
          });
        }
      });

      // Converter Map para array ordenado por data
      const events = Array.from(eventsMap.values()).sort((a, b) => {
        const dateA = a.event_date ? new Date(a.event_date).getTime() : Infinity;
        const dateB = b.event_date ? new Date(b.event_date).getTime() : Infinity;
        return dateA - dateB;
      });

      // Enriquecer posts com dados do evento se includePosts = true
      if (includePosts) {
        const allPosts: any[] = [];
        postsMap.forEach((posts, eventId) => {
          const matchedEvent = eventsMap.get(eventId);
          posts.forEach(post => {
            allPosts.push({
              ...post,
              events: matchedEvent ? { id: matchedEvent.id, title: matchedEvent.title } : null
            });
          });
        });

        return {
          events,
          posts: allPosts
        };
      }

      return {
        events,
        posts: []
      };
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
};

/**
 * Hook para buscar apenas eventos ativos de uma agência
 * Atalho para useEventsQuery com isActive=true
 */
export const useActiveEventsQuery = (agencyId?: string) => {
  return useEventsQuery({ agencyId, isActive: true });
};
