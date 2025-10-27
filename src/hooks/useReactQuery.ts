import { useQuery, useQueryClient, UseMutationOptions, useMutation } from '@tanstack/react-query';
import { sb } from '@/lib/supabaseSafe';

// Hook para eventos com cache
export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await sb.from('events').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache de 5 minutos
    gcTime: 10 * 60 * 1000, // Anteriormente cacheTime
  });
};

// Hook para submissions com filtros
export const useSubmissions = (eventFilter?: string, statusFilter?: string) => {
  return useQuery({
    queryKey: ['submissions', eventFilter, statusFilter],
    queryFn: async () => {
      let query = sb.from('submissions').select(`*, posts!inner(*, events(*)), profiles(*)`);
      if (eventFilter && eventFilter !== 'all') query = query.eq('posts.event_id', eventFilter);
      if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);
      const { data } = await query.order('submitted_at', { ascending: false });
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Hook para invalidar queries
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateSubmissions: () => queryClient.invalidateQueries({ queryKey: ['submissions'] }),
    invalidateEvents: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
};

// Hook para profiles
export const useProfiles = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data } = await sb.from('profiles').select('*');
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};
