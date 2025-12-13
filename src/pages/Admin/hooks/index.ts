/**
 * Admin Hooks - Fase 1 da Refatoração
 * Exporta todos os hooks consolidados do Admin
 */

export { useAdminState, type UseAdminStateReturn } from './useAdminState';
export { useAdminQueries, type UseAdminQueriesReturn, type UseAdminQueriesParams } from './useAdminQueries';
export { useAdminMutations, type UseAdminMutationsReturn, type UseAdminMutationsParams } from './useAdminMutations';
export { useAdminAgency, type UseAdminAgencyReturn, type UseAdminAgencyParams, type TrialInfo, type Agency } from './useAdminAgency';
export { 
  useAdminHandlers, 
  type UseAdminHandlersReturn, 
  type UseAdminHandlersParams,
  AVAILABLE_EXPORT_COLUMNS,
  REJECTION_TEMPLATES 
} from './useAdminHandlers';
