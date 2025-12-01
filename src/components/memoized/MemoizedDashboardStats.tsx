import { memo } from 'react';
import { DashboardStats } from '@/components/DashboardStats';

interface MemoizedDashboardStatsProps {
  eventId?: string;
}

/**
 * Versão memoizada do DashboardStats para evitar re-renders desnecessários
 * Só re-renderiza quando as props mudarem
 */
export const MemoizedDashboardStats = memo<MemoizedDashboardStatsProps>(DashboardStats);

MemoizedDashboardStats.displayName = 'MemoizedDashboardStats';
