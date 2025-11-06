import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

/**
 * Dashboard Filters Hook - URL-based Filter Management
 * 
 * Manages dashboard filters through URL query parameters,
 * ensuring filter persistence across page refreshes.
 * 
 * @returns {Object} Filter state and setter functions
 * @returns {Object} filters - Current filter values
 * @returns {string} filters.selectedHistoryEvent - Selected event ID or 'all'
 * @returns {Function} setSelectedHistoryEvent - Set event filter
 * @returns {Function} updateFilter - Generic filter updater
 * @returns {Function} clearFilters - Clear all filters
 * 
 * @example
 * const { filters, setSelectedHistoryEvent } = useDashboardFilters();
 * 
 * // Set event filter
 * setSelectedHistoryEvent('event-123');
 * 
 * // Access current value
 * console.log(filters.selectedHistoryEvent); // 'event-123'
 */
export const useDashboardFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Leitores de filtros da URL
  const selectedHistoryEvent = searchParams.get('event') || 'all';

  /**
   * Atualizador genérico de filtros
   */
  const updateFilter = useCallback((updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === 'all') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  /**
   * Setters individuais
   */
  const setSelectedHistoryEvent = useCallback((value: string) => {
    updateFilter({ event: value });
  }, [updateFilter]);

  /**
   * Limpar todos os filtros
   */
  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  /**
   * Estado dos filtros
   */
  const filters = useMemo(() => ({
    selectedHistoryEvent,
  }), [selectedHistoryEvent]);

  return {
    // Estado atual
    filters,
    
    // Setters
    setSelectedHistoryEvent,
    
    // Utilities
    updateFilter,
    clearFilters,
  };
};
