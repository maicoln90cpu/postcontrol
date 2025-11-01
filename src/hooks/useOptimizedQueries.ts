import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sb } from '@/lib/supabaseSafe';

// ============================================================================
// CACHE CONFIG - Configurações de cache por tipo de dado
// ============================================================================

const CACHE_TIMES = {
  // Dados que mudam raramente
  AGENCIES: 1000 * 60 * 10, // 10 minutos
  EVENTS: 1000 * 60 * 5, // 5 minutos
  PROFILES: 1000 * 60 * 5, // 5 minutos
  
  // Dados que mudam frequentemente
  SUBMISSIONS: 1000 * 60 * 2, // 2 minutos
  POSTS: 1000 * 60 * 3, // 3 minutos
  
  // Dados quase estáticos
  REJECTION_TEMPLATES: 1000 * 60 * 15, // 15 minutos
  EVENT_TEMPLATES: 1000 * 60 * 15, // 15 minutos
  
  // Dados dinâmicos
  NOTIFICATIONS: 1000 * 60 * 1, // 1 minuto
  USER_BADGES: 1000 * 60 * 5, // 5 minutos
};

// ============================================================================
// QUERY KEYS - Chaves padronizadas para cache
// ============================================================================

export const queryKeys = {
  // Agency related
  agencies: ['agencies'] as const,
  agency: (id: string) => ['agencies', id] as const,
  agencyStats: (id: string) => ['agencies', id, 'stats'] as const,
  
  // Events related
  events: (agencyId?: string) => ['events', { agencyId }] as const,
  event: (id: string) => ['events', id] as const,
  activeEvents: (agencyId?: string) => ['events', 'active', { agencyId }] as const,
  
  // Submissions related
  submissions: (filters: { agencyId?: string; status?: string; eventId?: string; userId?: string }) => 
    ['submissions', filters] as const,
  submission: (id: string) => ['submissions', id] as const,
  userSubmissions: (userId: string, agencyId: string) => 
    ['submissions', 'user', userId, agencyId] as const,
  
  // Posts related
  posts: (agencyId?: string, eventId?: string) => 
    ['posts', { agencyId, eventId }] as const,
  post: (id: string) => ['posts', id] as const,
  
  // Profiles related
  profiles: (agencyId?: string) => ['profiles', { agencyId }] as const,
  profile: (id: string) => ['profiles', id] as const,
  currentUser: ['profiles', 'current'] as const,
  
  // User related
  userRole: (userId: string) => ['user-role', userId] as const,
  userBadges: (userId: string) => ['user-badges', userId] as const,
  
  // Notifications
  notifications: (userId: string) => ['notifications', userId] as const,
  unreadNotifications: (userId: string) => ['notifications', userId, 'unread'] as const,
  
  // Templates
  rejectionTemplates: ['rejection-templates'] as const,
  eventTemplates: (agencyId?: string) => ['event-templates', { agencyId }] as const,
  
  // Stats
  dashboardStats: (userId: string, agencyId: string) => 
    ['dashboard-stats', userId, agencyId] as const,
};

// ============================================================================
// OPTIMIZED QUERIES - Queries otimizadas com cache
// ============================================================================

/**
 * Query otimizada para carregar eventos ativos com cache
 */
export const useActiveEvents = (agencyId?: string) => {
  return useQuery({
    queryKey: queryKeys.activeEvents(agencyId),
    queryFn: async () => {
      let query = sb
        .from('events')
        .select('id, title, description, is_active, event_date, agency_id')
        .eq('is_active', true)
        .order('event_date', { ascending: false });
      
      if (agencyId) {
        query = query.eq('agency_id', agencyId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    staleTime: CACHE_TIMES.EVENTS,
    gcTime: CACHE_TIMES.EVENTS * 2,
  });
};

/**
 * Query otimizada para carregar posts com eventos (JOIN otimizado)
 */
export const usePostsWithEvents = (agencyId?: string) => {
  return useQuery({
    queryKey: queryKeys.posts(agencyId),
    queryFn: async () => {
      let query = sb
        .from('posts')
        .select(`
          id,
          post_number,
          deadline,
          event_id,
          agency_id,
          created_at,
          events!inner(id, title)
        `)
        .order('created_at', { ascending: false });
      
      if (agencyId) {
        query = query.eq('agency_id', agencyId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    staleTime: CACHE_TIMES.POSTS,
    gcTime: CACHE_TIMES.POSTS * 2,
  });
};

/**
 * Query otimizada para submissões com filtros
 */
export const useSubmissions = (filters: {
  agencyId?: string;
  status?: string;
  eventId?: string;
  userId?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.submissions(filters),
    queryFn: async () => {
      let query = sb
        .from('submissions')
        .select(`
          id,
          user_id,
          post_id,
          status,
          submitted_at,
          screenshot_url,
          screenshot_path,
          profile_screenshot_path,
          rejection_reason,
          instagram_verified,
          agency_id,
          posts(
            id,
            post_number,
            deadline,
            event_id,
            events(id, title)
          ),
          profiles!inner(
            id,
            full_name,
            email,
            instagram,
            avatar_url
          )
        `)
        .order('submitted_at', { ascending: false });
      
      // Aplicar filtros apenas se fornecidos
      if (filters.agencyId) {
        query = query.eq('agency_id', filters.agencyId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.eventId && filters.eventId !== 'all') {
        query = query.eq('posts.event_id', filters.eventId);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    staleTime: CACHE_TIMES.SUBMISSIONS,
    gcTime: CACHE_TIMES.SUBMISSIONS * 2,
  });
};

/**
 * Query otimizada para perfis de usuários da agência
 */
export const useAgencyProfiles = (agencyId?: string) => {
  return useQuery({
    queryKey: queryKeys.profiles(agencyId),
    queryFn: async () => {
      let query = sb
        .from('profiles')
        .select('id, full_name, email, instagram, avatar_url, followers_range, agency_id')
        .order('full_name', { ascending: true });
      
      if (agencyId) {
        query = query.eq('agency_id', agencyId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    staleTime: CACHE_TIMES.PROFILES,
    gcTime: CACHE_TIMES.PROFILES * 2,
  });
};

/**
 * Query otimizada para badges do usuário
 */
export const useUserBadges = (userId?: string) => {
  return useQuery({
    queryKey: userId ? queryKeys.userBadges(userId) : ['user-badges', 'none'],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await sb
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: CACHE_TIMES.USER_BADGES,
    gcTime: CACHE_TIMES.USER_BADGES * 2,
  });
};

/**
 * Query otimizada para notificações não lidas
 */
export const useUnreadNotifications = (userId?: string) => {
  return useQuery({
    queryKey: userId ? queryKeys.unreadNotifications(userId) : ['notifications', 'none'],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await sb
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: CACHE_TIMES.NOTIFICATIONS,
    gcTime: CACHE_TIMES.NOTIFICATIONS * 2,
  });
};

/**
 * Query otimizada para templates de rejeição
 */
export const useRejectionTemplates = () => {
  return useQuery({
    queryKey: queryKeys.rejectionTemplates,
    queryFn: async () => {
      const { data, error } = await sb
        .from('rejection_templates')
        .select('*')
        .order('title', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    staleTime: CACHE_TIMES.REJECTION_TEMPLATES,
    gcTime: CACHE_TIMES.REJECTION_TEMPLATES * 2,
  });
};

// ============================================================================
// CACHE UTILITIES - Utilitários para invalidar cache
// ============================================================================

export const useCacheUtils = () => {
  const queryClient = useQueryClient();
  
  return {
    // Invalidar submissões
    invalidateSubmissions: (filters?: {
      agencyId?: string;
      status?: string;
      eventId?: string;
      userId?: string;
    }) => {
      if (filters) {
        return queryClient.invalidateQueries({ 
          queryKey: queryKeys.submissions(filters) 
        });
      }
      return queryClient.invalidateQueries({ 
        queryKey: ['submissions'] 
      });
    },
    
    // Invalidar eventos
    invalidateEvents: (agencyId?: string) => {
      return queryClient.invalidateQueries({ 
        queryKey: agencyId ? queryKeys.events(agencyId) : ['events'] 
      });
    },
    
    // Invalidar posts
    invalidatePosts: (agencyId?: string) => {
      return queryClient.invalidateQueries({ 
        queryKey: agencyId ? queryKeys.posts(agencyId) : ['posts'] 
      });
    },
    
    // Invalidar perfis
    invalidateProfiles: (agencyId?: string) => {
      return queryClient.invalidateQueries({ 
        queryKey: agencyId ? queryKeys.profiles(agencyId) : ['profiles'] 
      });
    },
    
    // Invalidar notificações
    invalidateNotifications: (userId: string) => {
      return queryClient.invalidateQueries({ 
        queryKey: queryKeys.notifications(userId) 
      });
    },
    
    // Invalidar tudo de uma agência
    invalidateAgency: (agencyId: string) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.events(agencyId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.posts(agencyId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profiles(agencyId) }),
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.submissions({ agencyId }) 
        }),
      ]);
    },
    
    // Limpar cache completo
    clearCache: () => {
      return queryClient.clear();
    },
  };
};
