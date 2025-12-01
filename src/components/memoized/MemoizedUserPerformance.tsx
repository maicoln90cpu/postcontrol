import { memo } from 'react';
import { UserPerformance } from '@/components/UserPerformance';

interface MemoizedUserPerformanceProps {
  eventId?: string;
}

/**
 * Versão memoizada do UserPerformance para evitar re-renders desnecessários
 * Só re-renderiza quando as props mudarem
 */
export const MemoizedUserPerformance = memo<MemoizedUserPerformanceProps>(UserPerformance);

MemoizedUserPerformance.displayName = 'MemoizedUserPerformance';
