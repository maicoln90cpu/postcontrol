/**
 * Types for Dashboard components and hooks
 * @module types/dashboard
 */

import { Database } from '@/integrations/supabase/types';

/**
 * Submission data structure from database
 */
export type Submission = Database['public']['Tables']['submissions']['Row'];

/**
 * Event data structure from database
 */
export type Event = Database['public']['Tables']['events']['Row'];

/**
 * Profile data structure from database
 */
export type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Event statistics for dashboard display
 * Single source of truth - used by useDashboard and all dashboard components
 */
export interface EventStats {
  /** Unique event identifier */
  eventId: string;
  /** Event display title */
  eventTitle: string;
  /** Number of approved submissions */
  submitted: number;
  /** Total required posts for event */
  totalRequired: number;
  /** Completion percentage (0-100) */
  percentage: number;
  /** Whether total count is approximate */
  isApproximate: boolean;
}

/**
 * Submission with enriched data for display (includes nested post/event data)
 */
export interface DashboardSubmission {
  id: string;
  submitted_at: string;
  screenshot_url: string | null;
  screenshot_path?: string | null;
  status: string;
  rejection_reason?: string | null;
  submission_type?: string | null;
  posts: {
    post_number: number;
    deadline: string;
    event_id: string;
    post_type?: string | null;
    events: {
      title: string;
      required_posts: number | null;
      id: string;
      is_active: boolean;
      agency_id: string | null;
      total_required_posts: number | null;
      is_approximate_total: boolean | null;
    } | null;
  } | null;
}

/**
 * Alias for backward compatibility
 * @deprecated Use DashboardSubmission instead
 */
export type SubmissionWithImage = DashboardSubmission;

/**
 * Dashboard filter state
 */
export interface DashboardFilters {
  /** Selected event ID or 'all' */
  selectedHistoryEvent: string;
}

/**
 * Dashboard data from useDashboard hook
 */
export interface DashboardData {
  /** User profile information */
  profile: Profile | null;
  /** User roles array */
  roles: string[];
  /** All user submissions */
  submissions: DashboardSubmission[];
  /** Active events for user */
  events: Event[];
  /** Event completion statistics */
  eventStats: EventStats[];
  /** Is user a master admin */
  isMasterAdmin: boolean;
  /** Is user an agency admin */
  isAgencyAdmin: boolean;
  /** Whether user has agencies linked */
  hasAgencies: boolean;
  /** User's agency IDs */
  userAgencyIds: string[];
}

/**
 * Dashboard local UI state (consolidated)
 */
export interface DashboardUIState {
  selectedAgencyId: string;
  selectedGender: string;
  instagram: string;
  newPassword: string;
  confirmPassword: string;
  submissionToDelete: { id: string; status: string } | null;
}
