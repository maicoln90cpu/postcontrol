/**
 * Hook consolidado para mutations do Admin
 * Centraliza todas as mutations e handlers relacionados
 */
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useUpdateSubmissionStatusMutation, 
  useBulkUpdateSubmissionStatusMutation,
  useDeleteEventMutation, 
  useDeleteSubmissionMutation 
} from "@/hooks/consolidated";
import { sb } from "@/lib/supabaseSafe";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { logger } from "@/lib/logger";

export interface UseAdminMutationsParams {
  userId: string | undefined;
  refetchEvents: () => void;
  refetchSubmissions: () => void;
  setEventToDelete: (id: string | null) => void;
  setPostToDelete: (data: { id: string; submissionsCount: number } | null) => void;
  setSubmissionToDelete: (id: string | null) => void;
  setIsDuplicatingEvent: (id: string | null) => void;
  setIsDeletingEvent: (id: string | null) => void;
  clearSelectedSubmissions: () => void;
}

export const useAdminMutations = ({
  userId,
  refetchEvents,
  refetchSubmissions,
  setEventToDelete,
  setPostToDelete,
  setSubmissionToDelete,
  setIsDuplicatingEvent,
  setIsDeletingEvent,
  clearSelectedSubmissions,
}: UseAdminMutationsParams) => {
  const queryClient = useQueryClient();
  
  // ========== Mutations ==========
  const updateStatusMutation = useUpdateSubmissionStatusMutation();
  const bulkUpdateStatusMutation = useBulkUpdateSubmissionStatusMutation();
  const deleteEventMutation = useDeleteEventMutation();
  const deleteSubmissionMutation = useDeleteSubmissionMutation();

  // ========== Submission Handlers ==========
  const handleApproveSubmission = useCallback(async (submissionId: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        submissionId,
        status: "approved",
        userId: userId || "",
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      refetchSubmissions();
    } catch (error) {
      console.error("Exception:", error);
    }
  }, [updateStatusMutation, userId, refetchSubmissions]);

  const handleRejectSubmission = useCallback(async (
    submissionId: string,
    rejectionReason?: string
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        submissionId,
        status: "rejected",
        userId: userId || "",
        rejectionReason,
      });

      refetchSubmissions();
    } catch (error) {
      console.error("Exception:", error);
    }
  }, [updateStatusMutation, userId, refetchSubmissions]);

  const handleStatusChange = useCallback(async (
    submissionId: string,
    newStatus: "approved" | "rejected" | "pending"
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        submissionId,
        status: newStatus,
        userId: userId || "",
      });
      refetchSubmissions();
    } catch (error) {
      console.error("Exception:", error);
    }
  }, [updateStatusMutation, userId, refetchSubmissions]);

  const handleBulkApprove = useCallback(async (selectedSubmissions: Set<string>) => {
    const ids = Array.from(selectedSubmissions);
    if (ids.length === 0) {
      toast.error("Selecione pelo menos uma submissão");
      return;
    }

    try {
      logger.info(`🚀 [Bulk Approve] Iniciando aprovação em massa de ${ids.length} submissões...`);
      toast.loading(`Aprovando ${ids.length} submissões...`, { id: "bulk-approve" });

      await bulkUpdateStatusMutation.mutateAsync({
        submissionIds: ids,
        status: "approved",
        userId: userId || "",
      });

      toast.success(`${ids.length} submissões aprovadas com sucesso`, { id: "bulk-approve" });
      clearSelectedSubmissions();
      logger.info(`✅ [Bulk Approve] Concluído`);
    } catch (error) {
      logger.error("❌ [Bulk Approve] Erro:", error);
      toast.error("Erro ao aprovar submissões em massa", { id: "bulk-approve" });
    }
  }, [bulkUpdateStatusMutation, userId, clearSelectedSubmissions]);

  // ========== Event Handlers ==========
  const handleDeleteEvent = useCallback(async (eventId: string) => {
    setIsDeletingEvent(eventId);
    try {
      await deleteEventMutation.mutateAsync(eventId);
      refetchEvents();
      setEventToDelete(null);
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setIsDeletingEvent(null);
    }
  }, [deleteEventMutation, refetchEvents, setEventToDelete, setIsDeletingEvent]);

  const handleDuplicateEvent = useCallback(async (event: any) => {
    setIsDuplicatingEvent(event.id);
    try {
      const { data: newEvent, error } = await sb.from("events").insert({
        title: `${event.title} - Cópia`,
        description: event.description,
        event_date: event.event_date,
        location: event.location,
        setor: event.setor,
        numero_de_vagas: event.numero_de_vagas,
        required_posts: event.required_posts,
        required_sales: event.required_sales,
        is_active: false,
        require_instagram_link: event.require_instagram_link,
        event_image_url: event.event_image_url,
        agency_id: event.agency_id,
        created_by: userId || event.created_by,
        event_purpose: event.event_purpose,
        whatsapp_group_url: event.whatsapp_group_url,
        whatsapp_group_title: event.whatsapp_group_title,
        accept_posts: event.accept_posts,
        accept_sales: event.accept_sales,
        require_profile_screenshot: event.require_profile_screenshot,
        require_post_screenshot: event.require_post_screenshot,
        target_gender: event.target_gender,
        internal_notes: event.internal_notes,
        total_required_posts: event.total_required_posts,
        is_approximate_total: event.is_approximate_total,
      }).select().single();

      if (error) throw error;

      // Duplicar requisitos
      const { data: requirements } = await sb.from("event_requirements")
        .select("*")
        .eq("event_id", event.id);

      if (requirements && requirements.length > 0) {
        const newRequirements = requirements.map((req: any) => ({
          event_id: newEvent.id,
          required_posts: req.required_posts,
          required_sales: req.required_sales,
          description: req.description,
          display_order: req.display_order,
        }));
        await sb.from("event_requirements").insert(newRequirements);
      }

      // Duplicar FAQs
      const { data: faqs } = await sb.from("event_faqs")
        .select("*")
        .eq("event_id", event.id);

      if (faqs && faqs.length > 0) {
        const newFaqs = faqs.map((faq: any) => ({
          event_id: newEvent.id,
          question: faq.question,
          answer: faq.answer,
          is_visible: faq.is_visible,
          display_order: faq.display_order,
        }));
        await sb.from("event_faqs").insert(newFaqs);
      }

      toast.success("Evento duplicado com sucesso! Requisitos e FAQs foram copiados.");
      refetchEvents();
    } catch (error) {
      console.error("Error duplicating event:", error);
      toast.error("Erro ao duplicar evento");
    } finally {
      setIsDuplicatingEvent(null);
    }
  }, [userId, refetchEvents, setIsDuplicatingEvent]);

  // ========== Post Handlers ==========
  const handleDeletePost = useCallback(async (postToDelete: { id: string; submissionsCount: number } | null) => {
    if (!postToDelete) return;

    try {
      // Deletar todas as submissões associadas primeiro
      const { error: submissionsError } = await sb.from("submissions")
        .delete()
        .eq("post_id", postToDelete.id);

      if (submissionsError) throw submissionsError;

      // Depois deletar o post
      const { error: postError } = await sb.from("posts")
        .delete()
        .eq("id", postToDelete.id);

      if (postError) throw postError;

      const submissionsText = postToDelete.submissionsCount === 1
        ? "1 submissão foi deletada"
        : `${postToDelete.submissionsCount} submissões foram deletadas`;

      toast.success(
        `Postagem deletada com sucesso${postToDelete.submissionsCount > 0 ? `. ${submissionsText}` : ""}`
      );

      refetchEvents();
      refetchSubmissions();
      setPostToDelete(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Erro ao deletar postagem");
    }
  }, [refetchEvents, refetchSubmissions, setPostToDelete]);

  const handleDeletePostClick = useCallback(async (postId: string) => {
    const { count } = await sb.from("submissions")
      .select("id", { count: "exact", head: false })
      .eq("post_id", postId);

    setPostToDelete({
      id: postId,
      submissionsCount: count || 0,
    });
  }, [setPostToDelete]);

  // ========== Submission Delete Handler ==========
  const handleDeleteSubmission = useCallback(async (submissionId: string | null) => {
    if (!submissionId) return;

    try {
      await deleteSubmissionMutation.mutateAsync(submissionId);
      refetchSubmissions();
      setSubmissionToDelete(null);
    } catch (error) {
      console.error("Error deleting submission:", error);
    }
  }, [deleteSubmissionMutation, refetchSubmissions, setSubmissionToDelete]);

  // ========== Cache Invalidation ==========
  const invalidateAllCaches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["events"] });
    queryClient.invalidateQueries({ queryKey: ["submission-counters"] });
    queryClient.invalidateQueries({ queryKey: ["submissions"] });
  }, [queryClient]);

  return {
    // Mutations
    updateStatusMutation,
    bulkUpdateStatusMutation,
    deleteEventMutation,
    deleteSubmissionMutation,

    // Submission handlers
    handleApproveSubmission,
    handleRejectSubmission,
    handleStatusChange,
    handleBulkApprove,

    // Event handlers
    handleDeleteEvent,
    handleDuplicateEvent,

    // Post handlers
    handleDeletePost,
    handleDeletePostClick,

    // Submission delete
    handleDeleteSubmission,

    // Utils
    invalidateAllCaches,

    // Loading states
    isApprovingSubmission: updateStatusMutation.isPending,
    isBulkApproving: bulkUpdateStatusMutation.isPending,
    isDeletingSubmission: deleteSubmissionMutation.isPending,
  };
};

export type UseAdminMutationsReturn = ReturnType<typeof useAdminMutations>;
