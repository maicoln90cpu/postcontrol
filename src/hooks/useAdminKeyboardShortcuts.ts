import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UseAdminKeyboardShortcutsProps {
  /** Currently selected submission IDs */
  selectedSubmissions: Set<string>;
  /** List of paginated submissions currently displayed */
  paginatedSubmissions: any[];
  /** Index of currently focused submission (for navigation) */
  focusedIndex: number;
  /** Setter for focused index */
  setFocusedIndex: (index: number) => void;
  /** Approve callback */
  onApprove: (submissionId: string) => void;
  /** Reject callback (opens rejection modal) */
  onReject: (submissionId: string) => void;
  /** Toggle selection callback */
  onToggleSelection: (submissionId: string) => void;
  /** Whether actions are disabled (read-only mode) */
  isReadOnly: boolean;
  /** Whether shortcuts are enabled (only in submissions tab) */
  enabled: boolean;
}

/**
 * Hook for keyboard shortcuts in Admin submission approval
 * 
 * Shortcuts:
 * - A: Approve focused/selected submission
 * - R: Open rejection modal for focused/selected submission
 * - ←/→ or J/K: Navigate between submissions
 * - Space: Toggle selection of focused submission
 * - Escape: Clear focus
 */
export const useAdminKeyboardShortcuts = ({
  selectedSubmissions,
  paginatedSubmissions,
  focusedIndex,
  setFocusedIndex,
  onApprove,
  onReject,
  onToggleSelection,
  isReadOnly,
  enabled,
}: UseAdminKeyboardShortcutsProps) => {
  
  // Get the currently actionable submission
  const getActionableSubmissionId = useCallback((): string | null => {
    // Priority 1: Single selected submission
    if (selectedSubmissions.size === 1) {
      return Array.from(selectedSubmissions)[0];
    }
    
    // Priority 2: Focused submission
    if (focusedIndex >= 0 && focusedIndex < paginatedSubmissions.length) {
      return paginatedSubmissions[focusedIndex]?.id || null;
    }
    
    // Priority 3: First submission if nothing focused
    if (paginatedSubmissions.length > 0 && focusedIndex === -1) {
      return paginatedSubmissions[0]?.id || null;
    }
    
    return null;
  }, [selectedSubmissions, focusedIndex, paginatedSubmissions]);

  // Check if focused submission is pending
  const isFocusedPending = useCallback((): boolean => {
    const id = getActionableSubmissionId();
    if (!id) return false;
    const submission = paginatedSubmissions.find(s => s.id === id);
    return submission?.status === 'pending';
  }, [getActionableSubmissionId, paginatedSubmissions]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const submissionId = getActionableSubmissionId();

      switch (e.key.toLowerCase()) {
        case 'a':
          // Approve focused/selected pending submission
          if (isReadOnly) {
            toast.warning('Você está em modo somente leitura');
            return;
          }
          if (!submissionId) {
            toast.warning('Selecione uma submissão primeiro');
            return;
          }
          if (!isFocusedPending()) {
            toast.warning('Apenas submissões pendentes podem ser aprovadas');
            return;
          }
          e.preventDefault();
          onApprove(submissionId);
          break;

        case 'r':
          // Reject focused/selected pending submission
          if (isReadOnly) {
            toast.warning('Você está em modo somente leitura');
            return;
          }
          if (!submissionId) {
            toast.warning('Selecione uma submissão primeiro');
            return;
          }
          if (!isFocusedPending()) {
            toast.warning('Apenas submissões pendentes podem ser rejeitadas');
            return;
          }
          e.preventDefault();
          onReject(submissionId);
          break;

        case 'arrowleft':
        case 'j':
          // Navigate to previous submission
          e.preventDefault();
          if (focusedIndex > 0) {
            setFocusedIndex(focusedIndex - 1);
          } else if (focusedIndex === -1 && paginatedSubmissions.length > 0) {
            setFocusedIndex(paginatedSubmissions.length - 1);
          }
          break;

        case 'arrowright':
        case 'k':
          // Navigate to next submission
          e.preventDefault();
          if (focusedIndex < paginatedSubmissions.length - 1) {
            setFocusedIndex(focusedIndex + 1);
          } else if (focusedIndex === -1 && paginatedSubmissions.length > 0) {
            setFocusedIndex(0);
          }
          break;

        case ' ':
          // Toggle selection of focused submission
          if (!submissionId) return;
          e.preventDefault();
          onToggleSelection(submissionId);
          break;

        case 'escape':
          // Clear focus
          e.preventDefault();
          setFocusedIndex(-1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    isReadOnly,
    focusedIndex,
    paginatedSubmissions,
    getActionableSubmissionId,
    isFocusedPending,
    onApprove,
    onReject,
    onToggleSelection,
    setFocusedIndex,
  ]);

  return {
    focusedIndex,
    setFocusedIndex,
  };
};
