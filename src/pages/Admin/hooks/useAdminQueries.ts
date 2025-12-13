/**
 * Hook consolidado para queries do Admin
 * Centraliza todas as queries de dados em um único hook
 */
import { useMemo, useCallback } from "react";
import { useEventsQuery, useSubmissionsQuery } from "@/hooks/consolidated";
import { useSubmissionCountsByEvent, useSubmissionCountsByPost, useApprovedSalesCount } from "@/hooks/useSubmissionCounters";
import { logger } from "@/lib/logger";

export interface UseAdminQueriesParams {
  agencyId: string | undefined;
  userId: string | undefined;
  isAgencyAdmin: boolean;
  isMasterAdmin: boolean;
  // Submission filters
  submissionEventFilter: string;
  submissionStatusFilter: string;
  postTypeFilter: string;
  searchTerm: string;
  submissionActiveFilter: string;
  submissionPostFilter: string;
  currentPage: number;
  itemsPerPage: number;
}

export const useAdminQueries = ({
  agencyId,
  userId,
  isAgencyAdmin,
  isMasterAdmin,
  submissionEventFilter,
  submissionStatusFilter,
  postTypeFilter,
  searchTerm,
  submissionActiveFilter,
  submissionPostFilter,
  currentPage,
  itemsPerPage,
}: UseAdminQueriesParams) => {
  const enabled = !!userId && (isAgencyAdmin || isMasterAdmin);

  // ========== Events Query ==========
  const {
    data: eventsData,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useEventsQuery({
    agencyId,
    isActive: undefined, // Buscar TODOS (ativos + inativos)
    includePosts: true,
    enabled,
  });

  const events = eventsData?.events || [];
  const allPosts = eventsData?.posts || [];

  // ========== Submissions Query ==========
  const {
    data: submissionsData,
    isLoading: submissionsLoading,
    refetch: refetchSubmissions,
  } = useSubmissionsQuery({
    agencyId,
    eventId: submissionEventFilter !== "all" ? submissionEventFilter : undefined,
    status: submissionStatusFilter !== "all" ? submissionStatusFilter : undefined,
    postType: postTypeFilter !== "all" ? postTypeFilter : undefined,
    searchTerm: searchTerm || undefined,
    isActive: submissionActiveFilter === "all" ? undefined : submissionActiveFilter === "active",
    postNumber: submissionPostFilter !== "all" ? parseInt(submissionPostFilter) : undefined,
    enrichProfiles: true,
    itemsPerPage,
    page: currentPage,
    enabled: enabled && !!agencyId,
  });

  const submissions = submissionsData?.data || [];
  const submissionsCount = submissionsData?.count || 0;

  // ========== Counters Queries ==========
  const {
    data: submissionsByEvent = {},
    isLoading: loadingEventCounters,
  } = useSubmissionCountsByEvent(agencyId, enabled);

  const {
    data: submissionsByPost = {},
    isLoading: loadingPostCounters,
  } = useSubmissionCountsByPost(agencyId, enabled);

  const {
    data: approvedSalesCount = 0,
    isLoading: loadingSalesCount,
  } = useApprovedSalesCount(agencyId, !!agencyId);

  const loadingCounters = loadingEventCounters || loadingPostCounters;

  // ========== Memoized Maps ==========
  const eventsById = useMemo(() => {
    const map = new Map();
    events.forEach(event => map.set(event.id, event));
    return map;
  }, [events]);

  // ========== Helper Functions ==========
  const getEventTitle = useCallback((post: any): string => {
    if (post.events?.title) return post.events.title;
    if (Array.isArray(post.events) && post.events[0]?.title) return post.events[0].title;
    if (post.event_id) {
      const foundEvent = eventsById.get(post.event_id);
      if (foundEvent) return foundEvent.title;
    }
    return "Evento não encontrado";
  }, [eventsById]);

  const getEventMetrics = useCallback((eventId: string) => {
    const eventPosts = allPosts.filter((p: any) => p.event_id === eventId);

    const postsByType = {
      comprovante: eventPosts.filter((p: any) => p.post_type === 'sale').length,
      divulgacao: eventPosts.filter((p: any) => p.post_type === 'divulgacao').length,
      selecao: eventPosts.filter((p: any) => p.post_type === 'selecao_perfil').length,
    };

    const totalSubmissions = eventPosts.reduce(
      (sum: number, post: any) => sum + (submissionsByPost[post.id] || 0),
      0
    );

    return {
      postsByType,
      totalSubmissions,
      totalPosts: eventPosts.length,
    };
  }, [allPosts, submissionsByPost]);

  const getAvailablePostNumbers = useCallback(() => {
    if (!submissionEventFilter || submissionEventFilter === "all") {
      return [];
    }

    const eventPosts = allPosts.filter(p => p.event_id === submissionEventFilter);
    if (!eventPosts || eventPosts.length === 0) {
      logger.warn(`⚠️ Nenhum post encontrado para o evento ${submissionEventFilter}`);
      return [];
    }

    const postNumbers = eventPosts
      .map(p => p.post_number)
      .filter((num): num is number => num !== null && num !== undefined)
      .sort((a, b) => a - b);

    return postNumbers;
  }, [allPosts, submissionEventFilter]);

  // ========== Pagination ==========
  const totalPages = Math.ceil(submissionsCount / itemsPerPage);

  // ========== Pending Count ==========
  const pendingCount = useMemo(() => {
    return submissions.filter((s: any) => s.status === 'pending').length;
  }, [submissions]);

  return {
    // Events
    events,
    eventsLoading,
    refetchEvents,
    eventsById,

    // Posts
    posts: allPosts,
    
    // Submissions
    submissions,
    submissionsCount,
    submissionsLoading,
    refetchSubmissions,
    totalPages,
    pendingCount,

    // Counters
    submissionsByEvent,
    submissionsByPost,
    approvedSalesCount,
    loadingCounters,
    loadingSalesCount,

    // Helpers
    getEventTitle,
    getEventMetrics,
    getAvailablePostNumbers,
  };
};

export type UseAdminQueriesReturn = ReturnType<typeof useAdminQueries>;
