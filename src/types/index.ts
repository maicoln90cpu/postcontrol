/**
 * Central Type Exports
 * @module types
 * 
 * Re-exports all types from specialized modules for convenient importing
 * 
 * @example
 * // Instead of:
 * import { EventStats } from '@/types/dashboard';
 * import { AdminFilters } from '@/types/admin';
 * 
 * // You can use:
 * import { EventStats, AdminFilters } from '@/types';
 */

// Dashboard types
export type {
  Submission as DashboardSubmission,
  Event as DashboardEvent,
  Profile as DashboardProfile,
  EventStats,
  SubmissionWithImage,
  DashboardFilters,
  DashboardData,
} from './dashboard';

// Admin types
export type {
  Submission as AdminSubmission,
  Event as AdminEvent,
  Post as AdminPost,
  Profile as AdminProfile,
  AdminFilters,
  EnrichedSubmission,
  ImageUrlCache,
  BulkOperationContext,
} from './admin';

// Guest types
export type {
  GuestPermission,
  GuestStatus,
  AgencyGuest,
  GuestEventPermission,
  GuestAuditLog,
  CreateGuestInvite,
} from './guest';

// Re-export constants
export {
  PERMISSION_LABELS,
  PERMISSION_DESCRIPTIONS,
  STATUS_LABELS,
} from './guest';

// API types
export type {
  ServiceResponse,
  PaginatedResponse,
  SubmissionFilters,
  EventFilters,
  ProfileFilters,
  SignedUrlResponse,
  UploadResponse,
} from './api';
