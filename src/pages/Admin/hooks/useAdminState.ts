/**
 * Hook consolidado para estados do Admin
 * Centraliza ~50 useState em um único hook organizado por categoria
 */
import { useState, useCallback } from "react";

export interface AdminDialogState {
  eventDialogOpen: boolean;
  postDialogOpen: boolean;
  suggestionDialogOpen: boolean;
  addSubmissionDialogOpen: boolean;
  rejectionDialogOpen: boolean;
  zoomDialogOpen: boolean;
  showColumnSelectionDialog: boolean;
}

export interface AdminSelectionState {
  selectedEvent: any;
  selectedPost: any;
  selectedSubmissions: Set<string>;
  selectedSubmissionForRejection: string | null;
  selectedEventForPrediction: string | null;
  selectedEventForRanking: string | null;
  selectedExportColumns: string[];
}

export interface AdminDeletionState {
  eventToDelete: string | null;
  postToDelete: { id: string; submissionsCount: number } | null;
  submissionToDelete: string | null;
}

export interface AdminRejectionState {
  rejectionReason: string;
  rejectionTemplate: string;
}

export interface AdminZoomState {
  zoomSubmissionIndex: number;
  selectedImageForZoom: string | null;
}

export interface AdminUIState {
  activeTab: string;
  collapsedEvents: Set<string>;
  focusedSubmissionIndex: number;
  expandedComments: Set<string>;
  auditLogSubmissionId: string | null;
  debouncedSearch: string;
}

export interface AdminStatsFilterState {
  globalStatsEventFilter: 'active' | 'inactive' | 'all';
  globalSelectedEventId: string;
}

export interface AdminLoadingState {
  isDuplicatingEvent: string | null;
  isDeletingEvent: string | null;
}

export const useAdminState = () => {
  // ========== Dialog States ==========
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [suggestionDialogOpen, setSuggestionDialogOpen] = useState(false);
  const [addSubmissionDialogOpen, setAddSubmissionDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [zoomDialogOpen, setZoomDialogOpen] = useState(false);
  const [showColumnSelectionDialog, setShowColumnSelectionDialog] = useState(false);

  // ========== Selection States ==========
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [selectedSubmissionForRejection, setSelectedSubmissionForRejection] = useState<string | null>(null);
  const [selectedEventForPrediction, setSelectedEventForPrediction] = useState<string | null>(null);
  const [selectedEventForRanking, setSelectedEventForRanking] = useState<string | null>(null);
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([]);

  // ========== Deletion States ==========
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<{ id: string; submissionsCount: number } | null>(null);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);

  // ========== Rejection States ==========
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionTemplate, setRejectionTemplate] = useState("");

  // ========== Zoom States ==========
  const [zoomSubmissionIndex, setZoomSubmissionIndex] = useState(0);
  const [selectedImageForZoom, setSelectedImageForZoom] = useState<string | null>(null);

  // ========== UI States ==========
  const [activeTab, setActiveTab] = useState("events");
  const [collapsedEvents, setCollapsedEvents] = useState<Set<string>>(new Set());
  const [focusedSubmissionIndex, setFocusedSubmissionIndex] = useState(-1);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [auditLogSubmissionId, setAuditLogSubmissionId] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ========== Stats Filter States ==========
  const [globalStatsEventFilter, setGlobalStatsEventFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [globalSelectedEventId, setGlobalSelectedEventId] = useState<string>('all');

  // ========== Loading States ==========
  const [isDuplicatingEvent, setIsDuplicatingEvent] = useState<string | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState<string | null>(null);

  // ========== Helper Functions ==========
  const toggleCollapsedEvent = useCallback((eventId: string) => {
    setCollapsedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, []);

  const toggleExpandedComment = useCallback((submissionId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(submissionId)) {
        next.delete(submissionId);
      } else {
        next.add(submissionId);
      }
      return next;
    });
  }, []);

  const toggleSubmissionSelection = useCallback((submissionId: string) => {
    setSelectedSubmissions(prev => {
      const next = new Set(prev);
      if (next.has(submissionId)) {
        next.delete(submissionId);
      } else {
        next.add(submissionId);
      }
      return next;
    });
  }, []);

  const clearSelectedSubmissions = useCallback(() => {
    setSelectedSubmissions(new Set());
  }, []);

  const selectAllSubmissions = useCallback((submissionIds: string[]) => {
    setSelectedSubmissions(new Set(submissionIds));
  }, []);

  const resetRejectionState = useCallback(() => {
    setRejectionDialogOpen(false);
    setSelectedSubmissionForRejection(null);
    setRejectionReason("");
    setRejectionTemplate("");
  }, []);

  const openRejectionDialog = useCallback((submissionId: string) => {
    setSelectedSubmissionForRejection(submissionId);
    setRejectionReason("");
    setRejectionTemplate("");
    setRejectionDialogOpen(true);
  }, []);

  const initializeCollapsedEvents = useCallback((eventIds: string[]) => {
    if (collapsedEvents.size === 0 && eventIds.length > 0) {
      setCollapsedEvents(new Set(eventIds));
    }
  }, [collapsedEvents.size]);

  return {
    // Dialog states
    dialogs: {
      eventDialogOpen, setEventDialogOpen,
      postDialogOpen, setPostDialogOpen,
      suggestionDialogOpen, setSuggestionDialogOpen,
      addSubmissionDialogOpen, setAddSubmissionDialogOpen,
      rejectionDialogOpen, setRejectionDialogOpen,
      zoomDialogOpen, setZoomDialogOpen,
      showColumnSelectionDialog, setShowColumnSelectionDialog,
    },

    // Selection states
    selection: {
      selectedEvent, setSelectedEvent,
      selectedPost, setSelectedPost,
      selectedSubmissions, setSelectedSubmissions,
      selectedSubmissionForRejection, setSelectedSubmissionForRejection,
      selectedEventForPrediction, setSelectedEventForPrediction,
      selectedEventForRanking, setSelectedEventForRanking,
      selectedExportColumns, setSelectedExportColumns,
      toggleSubmissionSelection,
      clearSelectedSubmissions,
      selectAllSubmissions,
    },

    // Deletion states
    deletion: {
      eventToDelete, setEventToDelete,
      postToDelete, setPostToDelete,
      submissionToDelete, setSubmissionToDelete,
    },

    // Rejection states
    rejection: {
      rejectionReason, setRejectionReason,
      rejectionTemplate, setRejectionTemplate,
      openRejectionDialog,
      resetRejectionState,
    },

    // Zoom states
    zoom: {
      zoomSubmissionIndex, setZoomSubmissionIndex,
      selectedImageForZoom, setSelectedImageForZoom,
    },

    // UI states
    ui: {
      activeTab, setActiveTab,
      collapsedEvents, setCollapsedEvents,
      toggleCollapsedEvent,
      initializeCollapsedEvents,
      focusedSubmissionIndex, setFocusedSubmissionIndex,
      expandedComments, toggleExpandedComment,
      auditLogSubmissionId, setAuditLogSubmissionId,
      debouncedSearch, setDebouncedSearch,
    },

    // Stats filter states
    statsFilter: {
      globalStatsEventFilter, setGlobalStatsEventFilter,
      globalSelectedEventId, setGlobalSelectedEventId,
    },

    // Loading states
    loading: {
      isDuplicatingEvent, setIsDuplicatingEvent,
      isDeletingEvent, setIsDeletingEvent,
    },
  };
};

export type UseAdminStateReturn = ReturnType<typeof useAdminState>;
