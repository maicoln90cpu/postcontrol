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
 * Submission with enriched data for display
 */
export interface SubmissionWithImage extends Omit<Submission, 'screenshot_path' | 'screenshot_url'> {
  /** Signed URL for screenshot display */
  screenshot_url?: string;
  /** Storage path for screenshot (optional) */
  screenshot_path?: string | null;
  /** Post data with event information */
  posts?: {
    post_number: number;
    post_type?: string | null;
    events?: {
      title: string;
    };
  };
}

/**
 * Dashboard filter state
 */
export interface DashboardFilters {
  /** Selected event ID or 'all' */
  selectedHistoryEvent: string;
}

/**
 * Dashboard data aggregation
 */
export interface DashboardData {
  /** User profile information */
  profile: Profile | null;
  /** User role in system */
  role: 'user' | 'agency_admin' | 'master_admin';
  /** Is user an agency admin */
  isAgencyAdmin: boolean;
  /** Is user a master admin */
  isMasterAdmin: boolean;
  /** Active agency ID */
  currentAgencyId: string | null;
  /** All user submissions */
  submissions: Submission[];
  /** Active events for user */
  events: Event[];
  /** Event completion statistics */
  eventStats: EventStats[];
  /** Number of approved submissions */
  approvedCount: number;
  /** Total submission count */
  totalSubmissions: number;
  /** Number of active events */
  activeEventsCount: number;
  /** Date of last submission */
  lastSubmissionDate: string | null;
}
