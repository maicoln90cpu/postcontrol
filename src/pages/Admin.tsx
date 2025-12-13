import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useAdminKeyboardShortcuts } from "@/hooks/useAdminKeyboardShortcuts";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { formatPostName } from "@/lib/postNameFormatter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// ✅ Sprint 3A: Importar componentes refatorados
import { AdminFilters } from "./Admin/AdminFilters";
import { AdminSubmissionList } from "./Admin/AdminSubmissionList";
import { AdminEventList } from "./Admin/AdminEventList";
import { useAdminFilters } from "./Admin/useAdminFilters";
import { SubmissionCardsGrid } from "@/components/SubmissionCardsGrid";

// ✅ FASE 5: Importar tabs refatorados
import { 
  AdminUsersTab, 
  AdminGuestsTab, 
  AdminAuditTab, 
  AdminSettingsTab, 
  AdminGuestListTab,
  AdminEventsTab,
  AdminPostsTab,
  AdminStatsTab
} from "./Admin/tabs";

// ✅ FASE 5.5: Importar componente de diálogos consolidado
import { AdminDialogs } from "./Admin/components/AdminDialogs";

// ✅ FASE 5.6: Importar componente de header consolidado
import { AdminHeader } from "./Admin/components/AdminHeader";

// ✅ FASE 5.7: Importar componente de stats cards consolidado
import { AdminStatsCards } from "./Admin/components/AdminStatsCards";

// ✅ FASE 5.4: Importar hook de estado consolidado
import { useAdminState } from "./Admin/hooks/useAdminState";

// ✅ FASE 6.1: Importar hook de queries consolidado
import { useAdminQueries } from "./Admin/hooks/useAdminQueries";

// ✅ FASE 6.2: Importar hook de mutations consolidado
import { useAdminMutations } from "./Admin/hooks/useAdminMutations";

// ✅ FASE 6.2: Mutations agora vêm do useAdminMutations
import { useQueryClient } from "@tanstack/react-query";
import { Calendar, Users, Trophy, Plus, Send, Pencil, Check, X, CheckCheck, Trash2, Copy, Columns3, Building2, ArrowLeft, Download, User, Clock, XCircle, MessageSquare, Lightbulb, CreditCard, Link as LinkIcon, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useUserRoleQuery } from "@/hooks/useUserRoleQuery";
import { useNavigate, Link } from "react-router-dom";

// Lazy loading de componentes pesados
const EventDialog = lazy(() => import("@/components/EventDialog").then(m => ({
  default: m.EventDialog
})));
const PostDialog = lazy(() => import("@/components/PostDialog").then(m => ({
  default: m.PostDialog
})));
const AddManualSubmissionDialog = lazy(() => import("@/components/AddManualSubmissionDialog").then(m => ({
  default: m.AddManualSubmissionDialog
})));
const AgencyAdminSettings = lazy(() => import("@/components/AgencyAdminSettings").then(m => ({
  default: m.AgencyAdminSettings
})));
const AdminTutorialGuide = lazy(() => import("@/components/AdminTutorialGuide"));
const SubmissionKanban = lazy(() => import("@/components/SubmissionKanban").then(m => ({
  default: m.SubmissionKanban
})));
const SubmissionAuditLog = lazy(() => import("@/components/SubmissionAuditLog").then(m => ({
  default: m.SubmissionAuditLog
})));
const SubmissionComments = lazy(() => import("@/components/SubmissionComments").then(m => ({
  default: m.SubmissionComments
})));
const SubmissionImageDisplay = lazy(() => import("@/components/SubmissionImageDisplay").then(m => ({
  default: m.SubmissionImageDisplay
})));
const GuestManager = lazy(() => import("@/components/GuestManager").then(m => ({
  default: m.GuestManager
})));
const GuestListManager = lazy(() => import("@/components/GuestListManager").then(m => ({
  default: m.default
})));
const GuestAuditLog = lazy(() => import("@/components/GuestAuditLog").then(m => ({
  default: m.GuestAuditLog
})));
const SuggestionDialog = lazy(() => import("@/components/SuggestionDialog").then(m => ({
  default: m.SuggestionDialog
}))); // ✅ ITEM 5 FASE 2
const PushNotificationAnalytics = lazy(() => import("@/components/PushNotificationAnalytics").then(m => ({
  default: m.PushNotificationAnalytics
})));
const TopPromotersRanking = lazy(() => import("@/components/TopPromotersRanking").then(m => ({
  default: m.TopPromotersRanking
})));
const DetailedGoalsReport = lazy(() => import("@/components/DetailedGoalsReport").then(m => ({
  default: m.DetailedGoalsReport
})));
const ReferralAnalytics = lazy(() => import("@/components/ReferralAnalytics").then(m => ({
  default: m.ReferralAnalytics
})));
const UTMLinkGenerator = lazy(() => import("@/components/UTMLinkGenerator").then(m => ({
  default: m.UTMLinkGenerator
})));
const GoalAchievedReport = lazy(() => import("@/components/GoalAchievedReport").then(m => ({
  default: m.GoalAchievedReport
})));
const GoalNotificationSettings = lazy(() => import("@/components/GoalNotificationSettings").then(m => ({
  default: m.GoalNotificationSettings
})));
const EventSlotsCounter = lazy(() => import("@/components/EventSlotsCounter").then(m => ({
  default: m.EventSlotsCounter
})));
const VirtualizedEventList = lazy(() => import("@/components/VirtualizedEventList").then(m => ({
  default: m.VirtualizedEventList
})));
const SlotExhaustionPrediction = lazy(() => import("@/components/SlotExhaustionPrediction").then(m => ({
  default: m.SlotExhaustionPrediction
})));
const SlotExhaustionAlert = lazy(() => import("@/components/SlotExhaustionAlert").then(m => ({
  default: m.SlotExhaustionAlert
})));
const ParticipantStatusManager = lazy(() => import("@/components/ParticipantStatusManager").then(m => ({
  default: m.ParticipantStatusManager
})));

// FASE 2: Componentes memoizados para performance
const MemoizedDashboardStats = lazy(() => import("@/components/memoized/MemoizedDashboardStats").then(m => ({
  default: m.MemoizedDashboardStats
})));
const MemoizedUserManagement = lazy(() => import("@/components/memoized/MemoizedUserManagement").then(m => ({
  default: m.MemoizedUserManagement
})));
const MemoizedAdminSettings = lazy(() => import("@/components/memoized/MemoizedAdminSettings").then(m => ({
  default: m.MemoizedAdminSettings
})));
const MemoizedUserPerformance = lazy(() => import("@/components/memoized/MemoizedUserPerformance").then(m => ({
  default: m.MemoizedUserPerformance
})));
import { SubmissionZoomDialog } from "@/components/SubmissionZoomDialog";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/lib/supabaseSafe";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import confetti from "canvas-confetti";
const Admin = () => {
  const {
    user,
    loading,
    signOut
  } = useAuthStore();
  const {
    isAgencyAdmin,
    isMasterAdmin
  } = useUserRoleQuery();
  const navigate = useNavigate();
  
  // ✅ FASE 5.4: Hook consolidado de estados (substituindo ~30 useState)
  const adminState = useAdminState();
  const {
    dialogs: {
      eventDialogOpen, setEventDialogOpen,
      postDialogOpen, setPostDialogOpen,
      suggestionDialogOpen, setSuggestionDialogOpen,
      addSubmissionDialogOpen, setAddSubmissionDialogOpen,
      rejectionDialogOpen, setRejectionDialogOpen,
      zoomDialogOpen, setZoomDialogOpen,
      showColumnSelectionDialog, setShowColumnSelectionDialog,
    },
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
    deletion: {
      eventToDelete, setEventToDelete,
      postToDelete, setPostToDelete,
      submissionToDelete, setSubmissionToDelete,
    },
    rejection: {
      rejectionReason, setRejectionReason,
      rejectionTemplate, setRejectionTemplate,
      openRejectionDialog,
      resetRejectionState,
    },
    zoom: {
      zoomSubmissionIndex, setZoomSubmissionIndex,
      selectedImageForZoom, setSelectedImageForZoom,
    },
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
    statsFilter: {
      globalStatsEventFilter, setGlobalStatsEventFilter,
      globalSelectedEventId, setGlobalSelectedEventId,
    },
    loading: {
      isDuplicatingEvent, setIsDuplicatingEvent,
      isDeletingEvent, setIsDeletingEvent,
    },
  } = adminState;

  // Estados que permanecem locais (específicos de dados/UI não consolidáveis)
  const [currentAgency, setCurrentAgency] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [agencySlug, setAgencySlug] = useState<string>("");
  const [rejectionTemplatesFromDB, setRejectionTemplatesFromDB] = useState<any[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [usersCount, setUsersCount] = useState(0);

  // ✅ SPRINT 1: Persistir índice de zoom entre filtros
  useEffect(() => {
    // Restaurar índice salvo ao montar componente
    const savedIndex = sessionStorage.getItem("adminZoomIndex");
    if (savedIndex && !isNaN(Number(savedIndex))) {
      setZoomSubmissionIndex(Number(savedIndex));
    }
  }, []);

  // ✅ SPRINT 1: Salvar índice quando diálogo abrir
  useEffect(() => {
    if (zoomDialogOpen) {
      sessionStorage.setItem("adminZoomIndex", zoomSubmissionIndex.toString());
      logger.info("💾 [Zoom] Índice salvo:", zoomSubmissionIndex);
    }
  }, [zoomDialogOpen, zoomSubmissionIndex]);

  // ✅ Inicializar queryClient para invalidação de cache
  const queryClient = useQueryClient();

  // ✅ Sprint 3A: Hook consolidado para filtros (substituindo ~12 useState)
  const {
    filters: {
      submissionEventFilter,
      submissionPostFilter,
      submissionStatusFilter,
      postTypeFilter,
      searchTerm,
      dateFilterStart,
      dateFilterEnd,
      currentPage,
      itemsPerPage,
      kanbanView,
      cardsGridView,
      eventActiveFilter,
      postEventFilter,
      postEventActiveFilter,
      eventSortOrder,
      submissionActiveFilter // ✅ ITEM 5
    },
    setSubmissionEventFilter,
    setSubmissionPostFilter,
    setSubmissionStatusFilter,
    setPostTypeFilter,
    setSearchTerm,
    setDateFilterStart,
    setDateFilterEnd,
    setCurrentPage,
    setItemsPerPage,
    setKanbanView,
    setCardsGridView,
    setEventActiveFilter,
    setPostEventFilter,
    setPostEventActiveFilter,
    setEventSortOrder,
    setSubmissionActiveFilter,
    // ✅ ITEM 5
    clearFilters // ✅ ITEM 3 FASE 1: Adicionar clearFilters
  } = useAdminFilters();

  // ✅ FASE 5.4: showColumnSelectionDialog e selectedExportColumns vêm do useAdminState

  // ✅ FASE 6.1: Hook consolidado de queries (substitui ~95 linhas de código)
  const adminQueries = useAdminQueries({
    agencyId: currentAgency?.id,
    userId: user?.id,
    isAgencyAdmin,
    isMasterAdmin,
    submissionEventFilter,
    submissionStatusFilter,
    postTypeFilter,
    searchTerm,
    submissionActiveFilter,
    submissionPostFilter,
    currentPage,
    itemsPerPage,
  });

  const {
    events,
    eventsLoading,
    refetchEvents,
    eventsById,
    posts: allPosts,
    submissions,
    submissionsCount,
    submissionsLoading,
    refetchSubmissions,
    totalPages,
    pendingCount,
    submissionsByEvent,
    submissionsByPost,
    approvedSalesCount,
    loadingCounters,
    loadingSalesCount,
    getEventTitle,
    getEventMetrics,
    getAvailablePostNumbers,
  } = adminQueries;

  // ✅ Alias para compatibilidade
  const posts = allPosts;
  const loadingEvents = eventsLoading;
  const loadingSubmissions = submissionsLoading;

  // ✅ FASE 6.2: Hook consolidado de mutations
  const adminMutations = useAdminMutations({
    userId: user?.id,
    refetchEvents,
    refetchSubmissions,
    setEventToDelete,
    setPostToDelete,
    setSubmissionToDelete,
    setIsDuplicatingEvent,
    setIsDeletingEvent,
    clearSelectedSubmissions,
  });

  const {
    updateStatusMutation,
    bulkUpdateStatusMutation,
    deleteEventMutation,
    deleteSubmissionMutation,
    handleApproveSubmission,
    handleRejectSubmission: handleRejectSubmissionDirect,
    handleStatusChange,
    handleBulkApprove,
    handleDeleteEvent,
    handleDuplicateEvent,
    handleDeletePost,
    handleDeletePostClick,
    handleDeleteSubmission,
    invalidateAllCaches,
    isApprovingSubmission,
    isBulkApproving,
    isDeletingSubmission,
  } = adminMutations;

  // Trial state management
  const [trialInfo, setTrialInfo] = useState<{
    inTrial: boolean;
    expired: boolean;
    daysRemaining: number;
  } | null>(null);

  // Compute read-only mode based on trial expiration
  const isReadOnly = trialInfo?.expired || false;

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ✅ FASE 1: Consolidação de useEffects para evitar múltiplas chamadas
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const agencySlug = urlParams.get("agency");
    const agencyId = urlParams.get("agencyId");
    const initializeData = async () => {
      if (!user || !isAgencyAdmin && !isMasterAdmin) return;
      logger.info("🚀 [Admin] Inicializando dados...");

      // 1. Carregar agência se houver slug/id na URL
      if (agencyId && isMasterAdmin) {
        await loadAgencyById(agencyId);
      } else if (agencySlug && (isAgencyAdmin || isMasterAdmin)) {
        await loadAgencyBySlug(agencySlug);
      } else {
        await loadCurrentAgency();
      }

      // 2. Carregar dados complementares
      loadRejectionTemplates();
      loadUsersCount();
    };
    initializeData();
  }, [user, isAgencyAdmin, isMasterAdmin]);

  // Estado para prevenir refetch duplicado
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  // ✅ ITEM 5: Resetar filtro de evento quando mudar status ativo/inativo
  useEffect(() => {
    setSubmissionEventFilter("all");
  }, [submissionActiveFilter]);

  // Recarregar eventos quando currentAgency estiver disponível
  useEffect(() => {
    if (currentAgency && !hasLoadedInitialData) {
      logger.info("✅ [Admin] currentAgency carregado, recarregando eventos...", currentAgency.name);
      refetchEvents();
      loadUsersCount();
      setHasLoadedInitialData(true);

      // Check trial status
      if (currentAgency.subscription_status === "trial") {
        const now = new Date();
        const startDate = currentAgency.trial_start_date ? new Date(currentAgency.trial_start_date) : null;
        const endDate = currentAgency.trial_end_date ? new Date(currentAgency.trial_end_date) : null;
        if (endDate) {
          const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setTrialInfo({
            inTrial: daysRemaining > 0,
            expired: daysRemaining <= 0,
            daysRemaining: Math.max(0, daysRemaining)
          });
        }
      } else {
        setTrialInfo(null);
      }
    }
  }, [currentAgency]);

  // ✅ CORREÇÃO 5: Adicionar Realtime listener para atualizar logo automaticamente
  useEffect(() => {
    if (!currentAgency?.id) return;
    const channel = sb.channel("agency-logo-updates").on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "agencies",
      filter: `id=eq.${currentAgency.id}`
    }, (payload: any) => {
      logger.info("🔄 [Realtime] Agência atualizada:", payload.new);
      if (payload.new.logo_url !== currentAgency.logo_url) {
        logger.info("🖼️ [Realtime] Logo atualizado:", payload.new.logo_url);
        setCurrentAgency((prev: any) => ({
          ...prev,
          logo_url: payload.new.logo_url
        }));
        toast.success("Logo atualizado!");
      }
    }).subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [currentAgency?.id]);

  // Carregar submissions apenas quando filtro ou agência mudarem
  // 🔴 CORREÇÃO 4: Proteção contra refetch duplicado
  const [hasLoadedSubmissions, setHasLoadedSubmissions] = useState(false);
  const [lastSubmissionFilter, setLastSubmissionFilter] = useState("");
  useEffect(() => {
    if (user && (isAgencyAdmin || isMasterAdmin) && currentAgency) {
      const filterKey = `${submissionEventFilter}-${currentAgency.id}`;
      // Apenas refetch se filtro realmente mudou OU primeira carga
      if (!hasLoadedSubmissions || lastSubmissionFilter !== filterKey) {
        logger.info("🔄 [Admin] Recarregando submissões...", filterKey);
        refetchSubmissions();
        setHasLoadedSubmissions(true);
        setLastSubmissionFilter(filterKey);
        // ✅ Invalidar cache de contadores ao trocar de agência/filtro
        queryClient.invalidateQueries({
          queryKey: ["submission-counters"]
        });
      }
    }
  }, [submissionEventFilter, currentAgency?.id]);

  // ✅ CORREÇÃO #3+4: Invalidar todos os caches quando agência mudar
  useEffect(() => {
    if (currentAgency?.id) {
      logger.info("🔄 [Admin] Invalidando caches para agência:", currentAgency.id);
      queryClient.invalidateQueries({
        queryKey: ["events"]
      });
      queryClient.invalidateQueries({
        queryKey: ["submission-counters"]
      });
      queryClient.invalidateQueries({
        queryKey: ["submissions"]
      });
    }
  }, [currentAgency?.id, queryClient]);
  const loadAgencyById = async (id: string) => {
    const {
      data
    } = await sb.from("agencies").select("id, name, slug, logo_url, subscription_plan, subscription_status, trial_start_date, trial_end_date").eq("id", id).maybeSingle();
    if (data) {
      setCurrentAgency(data);
      logger.info("🏢 Master Admin visualizando agência:", data.name);
    }
  };
  const loadCurrentAgency = async () => {
    if (!user) return;
    logger.info("🔍 [loadCurrentAgency] Iniciando...");

    // Load user profile
    const {
      data: profileData,
      error: profileError
    } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (profileError) {
      logger.error("❌ Erro ao carregar profile:", profileError);
      return;
    }
    logger.info("✅ Profile carregado:", {
      id: profileData?.id,
      email: profileData?.email,
      agency_id: profileData?.agency_id
    });
    setProfile(profileData);

    // If master admin and viewing specific agency, use query param
    const urlParams = new URLSearchParams(window.location.search);
    const agencySlug = urlParams.get("agency");
    const agencyId = urlParams.get("agencyId");
    if (agencySlug) {
      const {
        data,
        error
      } = await sb.from("agencies").select("id, name, slug, logo_url, subscription_plan, subscription_status, trial_start_date, trial_end_date").eq("slug", agencySlug).maybeSingle();
      if (error) {
        logger.error("❌ Erro ao carregar agência por slug:", error);
        return;
      }
      logger.info("🏢 Loaded agency from URL (slug):", data);
      setCurrentAgency(data);
      setAgencySlug(data?.slug || "");
      return;
    }
    if (agencyId && isMasterAdmin) {
      const {
        data,
        error
      } = await sb.from("agencies").select("id, name, slug, logo_url, subscription_plan, subscription_status, trial_start_date, trial_end_date").eq("id", agencyId).maybeSingle();
      if (error) {
        logger.error("❌ Erro ao carregar agência por ID:", error);
        return;
      }
      logger.info("🏢 Loaded agency from URL (id):", data);
      setCurrentAgency(data);
      setAgencySlug(data?.slug || "");
      return;
    }

    // If agency admin, load their own agency
    if (isAgencyAdmin && !isMasterAdmin && profileData?.agency_id) {
      logger.info("👤 Agency Admin detectado, carregando agência:", profileData.agency_id);
      const {
        data: agencyData,
        error: agencyError
      } = await sb.from("agencies").select("id, name, slug, logo_url, subscription_plan, subscription_status, trial_start_date, trial_end_date").eq("id", profileData.agency_id).maybeSingle();
      if (agencyError) {
        logger.error("❌ Erro ao carregar agência:", agencyError);
        toast.error("Erro ao carregar dados da agência");
        return;
      }
      if (!agencyData) {
        logger.error("❌ Agência não encontrada para ID:", profileData.agency_id);
        toast.error("Agência não encontrada");
        return;
      }
      logger.info("✅ Agência carregada:", agencyData);
      setCurrentAgency(agencyData);
      setAgencySlug(agencyData?.slug || "");
    } else if (isMasterAdmin && !agencySlug && !agencyId) {
      logger.info("👑 Master Admin sem filtro de agência - visualizando todos os dados");
    }
  };
  const loadAgencyBySlug = async (slug: string) => {
    const {
      data
    } = await sb.from("agencies").select("id, name, slug, logo_url, subscription_plan, subscription_status, trial_start_date, trial_end_date").eq("slug", slug).maybeSingle();
    setCurrentAgency(data);
  };
  const loadRejectionTemplates = async () => {
    const {
      data
    } = await sb.from("rejection_templates").select("*").order("title");
    setRejectionTemplatesFromDB(data || []);
  };
  const loadUsersCount = async () => {
    if (!user) return;
    let agencyIdFilter = null;
    const urlParams = new URLSearchParams(window.location.search);
    const queryAgencyId = urlParams.get("agencyId");
    if (queryAgencyId && isMasterAdmin) {
      agencyIdFilter = queryAgencyId;
    } else if (isMasterAdmin && !currentAgency) {
      agencyIdFilter = null;
    } else if (currentAgency) {
      agencyIdFilter = currentAgency.id;
    } else if (isAgencyAdmin) {
      const {
        data: profileData
      } = await sb.from("profiles").select("agency_id").eq("id", user.id).maybeSingle();
      agencyIdFilter = profileData?.agency_id;
    }
    let countQuery = sb.from("profiles").select("*", {
      count: "exact",
      head: true
    });
    if (agencyIdFilter) {
      countQuery = countQuery.eq("agency_id", agencyIdFilter);
    }
    const {
      count
    } = await countQuery;
    setUsersCount(count || 0);
  };

  // ✅ ITEM 10: useCallback para evitar re-criação da função
  const copySlugUrl = useCallback(() => {
    const url = `${window.location.origin}/agencia/${agencySlug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!", {
      description: "URL de cadastro copiada para a área de transferência"
    });
  }, [agencySlug]);
  const copyEventUrl = useCallback((agencySlug: string, eventSlug: string) => {
    const url = `${window.location.origin}/agencia/${agencySlug}/evento/${eventSlug}`;
    navigator.clipboard.writeText(url);
    toast.success("URL do Evento Copiada!", {
      description: "A URL pública do evento foi copiada para a área de transferência."
    });
  }, []);

  // ✅ FASE 6.2: handleApproveSubmission vem do useAdminMutations
  const handleRejectSubmission = async (submissionId: string) => {
    setSelectedSubmissionForRejection(submissionId);
    setRejectionReason("");
    setRejectionTemplate("");
    setRejectionDialogOpen(true);
  };

  // Linhas 436-481
  // ✅ Sprint 2B: Refatorar confirmRejection para usar mutation
  const confirmRejection = async () => {
    if (!selectedSubmissionForRejection) return;
    try {
      await updateStatusMutation.mutateAsync({
        submissionId: selectedSubmissionForRejection,
        status: "rejected",
        userId: user?.id || "",
        rejectionReason: rejectionReason || undefined
      });

      // Recarregar dados antes de fechar
      refetchSubmissions();

      // Fechar diálogo após sucesso
      setRejectionDialogOpen(false);
      setSelectedSubmissionForRejection(null);
      setRejectionReason("");
      setRejectionTemplate("");
    } catch (error) {
      console.error("Exception:", error);
    }
  };

  // Funções de navegação do zoom
  const handleOpenZoom = (submissionId: string) => {
    const index = getFilteredSubmissions.findIndex(s => s.id === submissionId);
    if (index !== -1) {
      setZoomSubmissionIndex(index);
      setZoomDialogOpen(true);
    }
  };
  const handleZoomNext = () => {
    if (zoomSubmissionIndex < getPaginatedSubmissions.length - 1) {
      setZoomSubmissionIndex(prev => prev + 1);
    }
  };
  const handleZoomPrevious = () => {
    if (zoomSubmissionIndex > 0) {
      setZoomSubmissionIndex(prev => prev - 1);
    }
  };
  const rejectionTemplates = [{
    value: "formato",
    label: "Imagem fora do padrão"
  }, {
    value: "conteudo",
    label: "Post não relacionado ao evento"
  }, {
    value: "prazo",
    label: "Prazo expirado"
  }, {
    value: "qualidade",
    label: "Qualidade da imagem inadequada"
  }, {
    value: "outro",
    label: "Outro (especificar abaixo)"
  }];
  // ✅ FASE 6.2: handleStatusChange vem do useAdminMutations (com wrapper para compatibilidade)
  const handleStatusChangeWrapper = (submissionId: string, newStatus: string) => {
    handleStatusChange(submissionId, newStatus as "approved" | "rejected" | "pending");
  };

  // ✅ FASE 6.2: handleBulkApprove vem do useAdminMutations (com wrapper para botão)
  const handleBulkApproveClick = () => handleBulkApprove(selectedSubmissions);
  // ✅ FASE 5.4: toggleSubmissionSelection vem do useAdminState
  const toggleSelectAll = () => {
    if (selectedSubmissions.size === getPaginatedSubmissions.length && getPaginatedSubmissions.length > 0) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(getPaginatedSubmissions.map((s: any) => s.id)));
    }
  };

  // ✅ SPRINT 2: Backend já retorna dados filtrados e paginados
  // Mantemos apenas filtros client-side que são edge cases raros (postNumber, datas)
  // NOTA: Esses filtros client-side são aplicados AO LADO do backend, não em cima
  const getFilteredSubmissions = useMemo(() => {
    let filtered = submissions;

    // 🆕 CORREÇÃO #3: REMOVIDO filtro client-side de post_number que causava limite incorreto
    // O filtro correto já é aplicado no backend via submissionService

    // Filtros de data (podem ser movidos para backend no futuro)
    if (dateFilterStart) {
      filtered = filtered.filter((s: any) => {
        const submitDate = new Date(s.submitted_at);
        const filterDate = new Date(dateFilterStart);
        return submitDate >= filterDate;
      });
    }
    if (dateFilterEnd) {
      filtered = filtered.filter((s: any) => {
        const submitDate = new Date(s.submitted_at);
        const filterDate = new Date(dateFilterEnd);
        return submitDate <= filterDate;
      });
    }
    return filtered;
  }, [submissions, submissionPostFilter, dateFilterStart, dateFilterEnd]);

  // ✅ SPRINT 2: Backend já retorna paginado, apenas usamos os dados filtrados
  const getPaginatedSubmissions = useMemo(() => {
    return getFilteredSubmissions;
  }, [getFilteredSubmissions]);

  // ✅ FASE 6.1: totalPages e pendingCount já vêm do useAdminQueries

  // ✅ FASE 3: Integrar atalhos de teclado
  useAdminKeyboardShortcuts({
    selectedSubmissions,
    paginatedSubmissions: getPaginatedSubmissions,
    focusedIndex: focusedSubmissionIndex,
    setFocusedIndex: setFocusedSubmissionIndex,
    onApprove: handleApproveSubmission,
    onReject: handleRejectSubmission,
    onToggleSelection: toggleSubmissionSelection,
    isReadOnly,
    enabled: activeTab === 'submissions'
  });

  // ✅ FASE 3: Resetar foco quando mudar de página ou filtro
  useEffect(() => {
    setFocusedSubmissionIndex(-1);
  }, [currentPage, submissionStatusFilter, submissionEventFilter]);

  // 🔴 GUARD: Validar índice do zoom quando array muda
  useEffect(() => {
    if (zoomDialogOpen) {
      // Se o índice atual está fora dos limites, fechar o diálogo
      if (zoomSubmissionIndex >= getPaginatedSubmissions.length || zoomSubmissionIndex < 0) {
        console.warn("⚠️ Zoom index out of bounds, closing dialog", {
          index: zoomSubmissionIndex,
          arrayLength: getPaginatedSubmissions.length
        });
        setZoomDialogOpen(false);
        setZoomSubmissionIndex(0);
      }
      // Se a submissão no índice atual é undefined, fechar
      else if (!getPaginatedSubmissions[zoomSubmissionIndex]) {
        console.warn("⚠️ Submission at index is undefined, closing dialog", {
          index: zoomSubmissionIndex
        });
        setZoomDialogOpen(false);
        setZoomSubmissionIndex(0);
      }
    }
  }, [zoomDialogOpen, zoomSubmissionIndex, getPaginatedSubmissions]);

  // ✅ Item 7: Estatísticas filtradas por agência
  const agencyFilteredStats = useMemo(() => {
    if (!currentAgency) {
      return {
        events: events.length,
        posts: posts.length,
        submissions: submissionsCount || 0,
        users: usersCount,
        sales: approvedSalesCount
      };
    }
    const agencyId = currentAgency.id;
    return {
      events: events.filter(e => e.agency_id === agencyId).length,
      posts: posts.filter(p => p.agency_id === agencyId).length,
      submissions: submissionsCount || 0,
      users: usersCount,
      sales: approvedSalesCount
    };
  }, [events, posts, submissionsCount, usersCount, currentAgency, approvedSalesCount]);

  // ✅ Item 9: Filtrar eventos por ativo/inativo
  // ✅ Item 7: Ordenar eventos por data
  const filteredEvents = useMemo(() => {
    // 1. Aplicar filtro de status
    let filtered = events;
    if (eventActiveFilter === "active") {
      filtered = events.filter(e => e.is_active === true);
    } else if (eventActiveFilter === "inactive") {
      // 🆕 CORREÇÃO #2: Filtrar por is_active !== true (captura false, null, undefined)
      filtered = events.filter(e => e.is_active !== true);
    }

    // 2. Aplicar ordenação
    const sorted = [...filtered];
    switch (eventSortOrder) {
      case "newest":
        return sorted.sort((a, b) => new Date(b.event_date || b.created_at).getTime() - new Date(a.event_date || a.created_at).getTime());
      case "oldest":
      default:
        return sorted.sort((a, b) => new Date(a.event_date || a.created_at).getTime() - new Date(b.event_date || b.created_at).getTime());
    }
  }, [events, eventActiveFilter, eventSortOrder]);

  // ✅ Item 10 + FASE 3: Filtrar postagens por evento e status do evento
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Filtrar por evento específico
    if (postEventFilter !== "all") {
      filtered = filtered.filter(p => p.event_id === postEventFilter);
    }

    // Filtrar por status do evento (ativo/inativo)
    if (postEventActiveFilter !== "all") {
      filtered = filtered.filter(p => {
        const event = events.find(e => e.id === p.event_id);
        if (!event) return false;
        return postEventActiveFilter === "active" ? event.is_active === true : event.is_active === false;
      });
    }
    return filtered;
  }, [posts, postEventFilter, postEventActiveFilter, events]);
  // ✅ FASE 6.2: Handlers de evento, post e submission vêm do useAdminMutations
  // Wrappers para compatibilidade com assinaturas sem parâmetros em dialogs
  const handleDeletePostWrapper = () => handleDeletePost(postToDelete!);
  const handleDeleteSubmissionWrapper = () => handleDeleteSubmission(submissionToDelete!);

  // ✅ FASE 6.1: getAvailablePostNumbers já vem do useAdminQueries

  // ✅ ITEM 1: Definir colunas disponíveis para exportação
  const availableExportColumns = [{
    key: "tipo",
    label: "Tipo"
  }, {
    key: "evento",
    label: "Evento"
  }, {
    key: "numero_postagem",
    label: "Número da Postagem"
  }, {
    key: "nome",
    label: "Nome"
  }, {
    key: "instagram",
    label: "Instagram"
  }, {
    key: "email",
    label: "Email"
  }, {
    key: "telefone",
    label: "Telefone"
  }, {
    key: "genero",
    label: "Gênero"
  }, {
    key: "seguidores",
    label: "Seguidores"
  }, {
    key: "status",
    label: "Status"
  }, {
    key: "data_envio",
    label: "Data de Envio"
  }, {
    key: "total_submissoes_aprovadas",
    label: "Total de Submissões Aprovadas"
  }, {
    key: "vendas_aprovadas_evento",
    label: "Vendas Aprovadas no Evento"
  },
  // ✅ ITEM 1: Nova coluna
  {
    key: "email_ticketeira",
    label: "E-mail da Ticketeira"
  }, {
    key: "motivo_rejeicao",
    label: "Motivo Rejeição"
  }, {
    key: "status_participante",
    label: "Status do Participante"
  }];

  // ✅ ITEM 1: Abrir popup de seleção de colunas
  const handleExportToExcel = useCallback(() => {
    // Validação básica
    if (submissionEventFilter === "all" || !submissionEventFilter) {
      toast.error("⚠️ Selecione um evento específico para exportar");
      return;
    }

    // Selecionar todas as colunas por padrão
    setSelectedExportColumns(availableExportColumns.map(col => col.key));
    setShowColumnSelectionDialog(true);
  }, [submissionEventFilter]);

  // ✅ ITEM 1: Executar exportação após seleção de colunas
  const executeExport = useCallback(async () => {
    try {
      const XLSX = await import("xlsx");

      // Validação
      if (submissionEventFilter === "all" || !submissionEventFilter) {
        toast.error("⚠️ Selecione um evento específico para exportar");
        return;
      }

      // 🔥 CORREÇÃO: Buscar TODAS as submissões do evento, não apenas a página atual
      toast.info("🔄 Buscando todas as submissões do evento...");
      const {
        data: allEventSubmissions,
        error: fetchError
      } = await sb.from("submissions").select(`
          *,
          posts(id, post_number, deadline, event_id, post_type)
        `).eq("event_id", submissionEventFilter).order("created_at", {
        ascending: false
      });
      if (fetchError) {
        console.error("❌ Erro ao buscar submissões:", fetchError);
        toast.error("Erro ao buscar submissões para exportação");
        return;
      }
      const freshSubmissions = allEventSubmissions || [];
      if (!freshSubmissions || freshSubmissions.length === 0) {
        toast.error(`❌ Nenhuma submissão encontrada para o evento selecionado`);
        return;
      }

      // ✅ RESTAURAR: Aplicar filtros client-side (post number, dates)
      let filteredSubmissions = freshSubmissions;

      // Filtro de Post Number
      if (submissionPostFilter && submissionPostFilter !== "all") {
        filteredSubmissions = filteredSubmissions.filter((s: any) => s.posts?.post_number?.toString() === submissionPostFilter);
      }

      // Filtro de Data Início
      if (dateFilterStart) {
        filteredSubmissions = filteredSubmissions.filter((s: any) => {
          const submitDate = new Date(s.submitted_at);
          const filterDate = new Date(dateFilterStart);
          return submitDate >= filterDate;
        });
      }

      // Filtro de Data Fim
      if (dateFilterEnd) {
        filteredSubmissions = filteredSubmissions.filter((s: any) => {
          const submitDate = new Date(s.submitted_at);
          const filterDate = new Date(dateFilterEnd);
          return submitDate <= filterDate;
        });
      }

      // ✅ AGORA SIM: Verificar se sobrou algo após filtros
      if (filteredSubmissions.length === 0) {
        toast.error(`❌ Nenhuma submissão encontrada com os filtros de data/post aplicados`);
        return;
      }

      // Buscar dados completos das submissões filtradas
      const submissionIds = filteredSubmissions.map(s => s.id);
      if (submissionIds.length === 0) {
        toast.error("Nenhuma submissão disponível para exportar");
        return;
      }

      // 🔧 CORREÇÃO 1: Buscar submissions e profiles separadamente
      const {
        data: fullSubmissionsData,
        error: submissionsError
      } = await sb.from("submissions").select("*").in("id", submissionIds);
      if (submissionsError) {
        console.error("❌ Erro ao buscar submissões:", submissionsError);
        toast.error("Erro ao buscar submissões");
        return;
      }

      // Buscar perfis dos usuários com batching
      const userIds = [...new Set(fullSubmissionsData.map(s => s.user_id))];

      // 🔴 CORREÇÃO 3: Dividir em chunks de 30 para otimizar requests
      const chunkArray = <T,>(array: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
      };

      // 🔴 CORREÇÃO 3: Aumentar batch size para 30 UUIDs
      const userIdChunks = chunkArray(userIds, 30);
      const profilesResults = await Promise.all(userIdChunks.map(chunk => sb.from("profiles").select("id, full_name, instagram, email, phone, gender, followers_range").in("id", chunk).then(res => res.data || [])));
      const profilesData = profilesResults.flat();

      // Criar map de profiles
      const profilesMap: Record<string, any> = {};
      (profilesData || []).forEach(profile => {
        profilesMap[profile.id] = profile;
      });

      // Buscar status de participação do evento
      const {
        data: participationData,
        error: participationError
      } = await sb.from("user_event_goals").select("user_id, participation_status, goal_achieved").eq("event_id", submissionEventFilter).in("user_id", userIds);
      if (participationError) {
        console.error("Erro ao buscar dados de participação:", participationError);
      }

      // Criar map de participação
      const participationMap: Record<string, any> = {};
      (participationData || []).forEach((p: any) => {
        participationMap[p.user_id] = p;
      });

      // 🆕 Buscar total de submissões aprovadas por usuário no evento específico
      let approvedQuery = sb.from("submissions").select("user_id, post_id, posts!inner(event_id)").in("user_id", userIds).eq("status", "approved").eq("submission_type", "divulgacao");

      // Filtrar por evento específico se não for "all"
      if (submissionEventFilter !== "all") {
        approvedQuery = approvedQuery.eq("posts.event_id", submissionEventFilter);
      }
      const {
        data: approvedCountsData
      } = await approvedQuery;

      // Criar map: user_id => total de submissões aprovadas
      const approvedCountsMap: Record<string, number> = {};
      (approvedCountsData || []).forEach(item => {
        approvedCountsMap[item.user_id] = (approvedCountsMap[item.user_id] || 0) + 1;
      });
      logger.info("✅ Contagens de aprovados carregadas:", {
        usuariosComAprovados: Object.keys(approvedCountsMap).length,
        totalUsuarios: userIds.length,
        eventoFiltrado: submissionEventFilter !== "all" ? submissionEventFilter : "todos"
      });

      // ✅ ITEM 1: Buscar vendas aprovadas por usuário NESTE EVENTO ESPECÍFICO
      const {
        data: eventSalesData
      } = await sb.from("submissions").select("user_id").in("user_id", userIds).eq("event_id", submissionEventFilter).eq("submission_type", "sale").eq("status", "approved");
      const eventSalesMap: Record<string, number> = {};
      (eventSalesData || []).forEach((item: any) => {
        if (item.user_id) {
          eventSalesMap[item.user_id] = (eventSalesMap[item.user_id] || 0) + 1;
        }
      });
      logger.info(`✅ Vendas aprovadas no evento carregadas para ${Object.keys(eventSalesMap).length} usuários`);

      // Enriquecer submissions com profiles
      const enrichedSubmissions = fullSubmissionsData.map(sub => ({
        ...sub,
        profiles: profilesMap[sub.user_id] || {
          full_name: "Usuário Desconhecido",
          instagram: null,
          email: null,
          gender: null,
          followers_range: null
        }
      }));

      // 🔧 ITEM 7: Buscar informações de posts com query robusta
      let postsMap: Record<string, any> = {};
      if (submissionIds.length > 0) {
        logger.info("🔍 Buscando posts para", submissionIds.length, "submissões");

        // Passo 1: Buscar post_ids das submissões
        const {
          data: submissionsWithPosts,
          error: postsIdsError
        } = await sb.from("submissions").select("id, post_id").in("id", submissionIds).not("post_id", "is", null);
        if (postsIdsError) {
          logger.error("Erro ao buscar post_ids:", postsIdsError);
        } else {
          const postIds = (submissionsWithPosts || []).map((s: any) => s.post_id).filter(Boolean);
          if (postIds.length > 0) {
            // Passo 2: Buscar dados dos posts
            const {
              data: postsData,
              error: postsError
            } = await sb.from("posts").select(`
                id,
                post_number,
                event_id,
                events (
                  title
                )
              `).in("id", postIds);
            if (postsError) {
              logger.error("Erro ao buscar posts:", postsError);
            } else {
              // Criar map de post_id → post_data
              const postsDataMap: Record<string, any> = {};
              (postsData || []).forEach((post: any) => {
                if (post?.id) {
                  postsDataMap[post.id] = {
                    post_number: post.post_number || 0,
                    event_title: post.events?.title || "Evento Desconhecido"
                  };
                }
              });

              // Criar map de submission_id → post_data
              (submissionsWithPosts || []).forEach((item: any) => {
                if (item?.id && item?.post_id && postsDataMap[item.post_id]) {
                  postsMap[item.id] = postsDataMap[item.post_id];
                }
              });
              logger.info("✅ Posts carregados:", {
                submissionsTotal: submissionIds.length,
                postsEncontrados: Object.keys(postsDataMap).length,
                submissoesComPosts: Object.keys(postsMap).length
              });
            }
          }
        }
      }
      logger.info("📊 Posts mapeados:", Object.keys(postsMap).length, "de", submissionIds.length);

      // ✅ ITEM 1: Preparar dados completos (todas as colunas)
      const fullExportData = (enrichedSubmissions || []).map((sub: any) => {
        const eventTitle = postsMap[sub.id]?.event_title || "Evento não identificado";
        const postNumber = postsMap[sub.id]?.post_number || 0;
        return {
          tipo: sub.submission_type === "divulgacao" ? "Divulgação" : "Venda",
          evento: eventTitle,
          numero_postagem: postNumber,
          nome: sub.profiles?.full_name || "N/A",
          instagram: sub.profiles?.instagram ? `https://instagram.com/${sub.profiles.instagram.replace("@", "")}` : "N/A",
          email: sub.profiles?.email || "N/A",
          telefone: sub.profiles?.phone || "N/A",
          genero: sub.profiles?.gender || "N/A",
          seguidores: sub.profiles?.followers_range || "N/A",
          status: sub.status === "approved" ? "Aprovado" : sub.status === "rejected" ? "Rejeitado" : "Pendente",
          data_envio: new Date(sub.submitted_at).toLocaleString("pt-BR"),
          total_submissoes_aprovadas: approvedCountsMap[sub.user_id] || 0,
          vendas_aprovadas_evento: eventSalesMap[sub.user_id] || 0,
          // ✅ ITEM 1: Nova coluna
          email_ticketeira: sub.user_ticketer_email || "N/A",
          motivo_rejeicao: sub.rejection_reason || "N/A",
          status_participante: (() => {
            const p = participationMap[sub.user_id];
            if (!p) return "Em Progresso";
            if (p.participation_status === 'withdrawn') return "Removida";
            if (p.goal_achieved) return "Bateu Meta";
            return "Em Progresso";
          })()
        };
      });

      // ✅ ITEM 1: Filtrar apenas colunas selecionadas
      const columnLabelsMap: Record<string, string> = {};
      availableExportColumns.forEach(col => {
        columnLabelsMap[col.key] = col.label;
      });
      const exportData = fullExportData.map(row => {
        const filteredRow: Record<string, any> = {};
        selectedExportColumns.forEach(colKey => {
          const label = columnLabelsMap[colKey];
          if (label && row.hasOwnProperty(colKey)) {
            filteredRow[label] = row[colKey];
          }
        });
        return filteredRow;
      });

      // Criar worksheet e workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Submissões");

      // Download
      const eventName = events.find(e => e.id === submissionEventFilter)?.title || "filtradas";
      XLSX.writeFile(wb, `submissoes_${eventName}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(`${exportData.length} submissão(ões) exportada(s) com sucesso!`);
      setShowColumnSelectionDialog(false); // ✅ ITEM 1: Fechar dialog após exportar
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar submissões");
    }
  }, [submissionEventFilter, events, selectedExportColumns, availableExportColumns, submissionPostFilter, dateFilterStart, dateFilterEnd, submissions, submissionsCount]);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>;
  }
  if (!user || !isAgencyAdmin && !isMasterAdmin) {
    return null;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <Suspense fallback={null}>
        <AdminTutorialGuide />
      </Suspense>
      {/* ✅ FASE 5.6: Componente consolidado de header */}
      <AdminHeader
        profile={profile}
        currentAgency={currentAgency}
        trialInfo={trialInfo}
        agencySlug={agencySlug}
        isMasterAdmin={isMasterAdmin || false}
        onCopySlugUrl={copySlugUrl}
        onSuggestionClick={() => setSuggestionDialogOpen(true)}
        onSignOut={signOut}
      />

      <div className="container mx-auto px-4 py-8">
        {/* ✅ FASE 5.7: Stats Cards refatorados */}
        <AdminStatsCards 
          stats={agencyFilteredStats} 
          loadingSalesCount={loadingSalesCount} 
        />

        {/* Main Content */}
        <Tabs defaultValue="events" className="space-y-6" onValueChange={value => {
        // ✅ FASE 3: Atualizar tab ativa para atalhos de teclado
        setActiveTab(value);
        // ✅ ITEM 3 FASE 1: Limpar filtros de submissões ao sair da aba
        if (value !== "submissions") {
          clearFilters();
        }
      }}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-10 gap-1 h-auto">
            <TabsTrigger value="events" className="text-xs sm:text-sm py-2">
              Eventos
            </TabsTrigger>
            <TabsTrigger value="posts" className="text-xs sm:text-sm py-2">
              Postagens
            </TabsTrigger>
            {/* ✅ FASE 3: Badge com contador de pendentes */}
            <TabsTrigger id="submissions-tab" value="submissions" className="text-xs sm:text-sm py-2 relative">
              Submissões
              {pendingCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </Badge>}
            </TabsTrigger>
            <TabsTrigger id="users-tab" value="users" className="text-xs sm:text-sm py-2">
              Usuários
            </TabsTrigger>
            <TabsTrigger value="guests" className="text-xs sm:text-sm py-2">
              Convidados
            </TabsTrigger>
            <TabsTrigger value="guest-lists" className="text-xs sm:text-sm py-2">
              Controle de Listas
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs sm:text-sm py-2">
              Auditoria
            </TabsTrigger>
            <TabsTrigger value="statistics" className="text-xs sm:text-sm py-2">
              Estatísticas
            </TabsTrigger>
            {/* Push tab desativada - sistema push desabilitado */}
            <TabsTrigger id="settings-tab" value="settings" className="text-xs sm:text-sm py-2">
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* ✅ FASE 5.1: Tab de Eventos integrada */}
          <AdminEventsTab
            events={events || []}
            filteredEvents={filteredEvents}
            eventActiveFilter={eventActiveFilter}
            eventSortOrder={eventSortOrder}
            isReadOnly={isReadOnly}
            isDuplicatingEvent={isDuplicatingEvent}
            isDeletingEvent={isDeletingEvent}
            submissionsByEvent={submissionsByEvent}
            agencySlug={currentAgency?.slug}
            onEventActiveFilterChange={setEventActiveFilter}
            onEventSortOrderChange={setEventSortOrder}
            onNewEvent={() => {
              setSelectedEvent(null);
              setEventDialogOpen(true);
            }}
            onEditEvent={(event) => {
              setSelectedEvent(event);
              setEventDialogOpen(true);
            }}
            onDuplicateEvent={handleDuplicateEvent}
            onDeleteEvent={setEventToDelete}
            onCopyEventUrl={copyEventUrl}
          />

          {/* ✅ FASE 5.2: Tab de Postagens integrada */}
          <AdminPostsTab
            posts={allPosts}
            events={events || []}
            filteredPosts={filteredPosts}
            collapsedEvents={collapsedEvents}
            submissionsByPost={submissionsByPost}
            isReadOnly={isReadOnly}
            loadingEvents={loadingEvents}
            postEventFilter={postEventFilter}
            postEventActiveFilter={postEventActiveFilter}
            onToggleCollapse={(eventId) => {
              setCollapsedEvents(prev => {
                const newSet = new Set(prev);
                if (newSet.has(eventId)) {
                  newSet.delete(eventId);
                } else {
                  newSet.add(eventId);
                }
                return newSet;
              });
            }}
            onNewPost={() => {
              setSelectedPost(null);
              setPostDialogOpen(true);
            }}
            onEditPost={(post) => {
              setSelectedPost(post);
              setPostDialogOpen(true);
            }}
            onDeletePost={handleDeletePostClick}
            onPostEventFilterChange={setPostEventFilter}
            onPostEventActiveFilterChange={setPostEventActiveFilter}
            getEventMetrics={getEventMetrics}
          />

          <TabsContent value="submissions" className="space-y-6">
            {/* ✅ FASE 3: Dica de atalhos de teclado */}
            <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2 bg-muted/30 rounded-md text-xs text-muted-foreground">
              <span>⌨️ Atalhos: <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">A</kbd> Aprovar · <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">R</kbd> Rejeitar · <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">←</kbd><kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">→</kbd> Navegar · <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Espaço</kbd> Selecionar</span>
              {pendingCount > 0 && <Badge variant="outline" className="text-xs">
                  {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
                </Badge>}
            </div>

            {/* ✅ Sprint 3A: Usar componente AdminFilters refatorado */}
            <AdminFilters submissionActiveFilter={submissionActiveFilter} // ✅ ITEM 5: Novo filtro
          submissionEventFilter={submissionEventFilter} submissionPostFilter={submissionPostFilter} submissionStatusFilter={submissionStatusFilter} postTypeFilter={postTypeFilter} searchTerm={searchTerm} dateFilterStart={dateFilterStart} dateFilterEnd={dateFilterEnd} kanbanView={kanbanView} cardsGridView={cardsGridView} events={events} submissions={submissions} allPosts={allPosts} onSubmissionActiveFilterChange={setSubmissionActiveFilter} // ✅ ITEM 5: Handler
          onSubmissionEventFilterChange={setSubmissionEventFilter} onSubmissionPostFilterChange={setSubmissionPostFilter} onSubmissionStatusFilterChange={setSubmissionStatusFilter} onPostTypeFilterChange={setPostTypeFilter} onSearchTermChange={setSearchTerm} onDateFilterStartChange={setDateFilterStart} onDateFilterEndChange={setDateFilterEnd} onKanbanViewToggle={() => setKanbanView(!kanbanView)} onCardsGridViewToggle={() => setCardsGridView(!cardsGridView)} onExport={handleExportToExcel} filteredCount={getPaginatedSubmissions.length} totalCount={submissionsCount || 0} isLoadingSubmissions={loadingSubmissions} />

            {/* ✅ SPRINT 2: Indicador de filtros ativos */}
            {(submissionStatusFilter !== "all" && submissionStatusFilter !== "pending" || postTypeFilter !== "all" || debouncedSearch || submissionEventFilter !== "all" || submissionActiveFilter !== "all") &&
          // ✅ ITEM 5: Incluir novo filtro
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-md mb-4">
                <span className="text-sm font-medium">🔍 Filtros ativos:</span>
                <span className="text-sm text-muted-foreground">
                  {submissionsCount || 0} resultado(s) encontrado(s)
                </span>
              </div>}

            {kanbanView ? <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <SubmissionKanban submissions={getPaginatedSubmissions as any} onUpdate={refetchSubmissions} userId={user?.id} />
              </Suspense> : cardsGridView ? <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <SubmissionCardsGrid submissions={getFilteredSubmissions as any} currentPage={currentPage} itemsPerPage={itemsPerPage} totalPages={totalPages} selectedSubmissions={selectedSubmissions} imageUrls={imageUrls} isReadOnly={isReadOnly} onPageChange={setCurrentPage} onApprove={handleApproveSubmission} onReject={handleRejectSubmission} onToggleSelection={toggleSubmissionSelection} onImageZoom={handleOpenZoom} SubmissionImageDisplay={SubmissionImageDisplay} />
              </Suspense> : loadingSubmissions ? <Card className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando submissões...</p>
              </Card> : <>
                {selectedSubmissions.size > 0 && <Button onClick={handleBulkApproveClick} className="bg-green-500 hover:bg-green-600 w-full sm:w-auto mb-4">
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Aprovar {selectedSubmissions.size}
                  </Button>}

                <Card className="p-6">
                  {getPaginatedSubmissions.length === 0 ? <p className="text-muted-foreground text-center py-8">
                      Nenhuma submissão encontrada com os filtros selecionados
                    </p> : <>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-4 border-b">
                          <Checkbox checked={selectedSubmissions.size === getPaginatedSubmissions.length && getPaginatedSubmissions.length > 0} onCheckedChange={toggleSelectAll} />
                          <span className="text-sm text-muted-foreground">
                            Selecionar todos desta página ({getPaginatedSubmissions.length})
                          </span>
                        </div>
                        {getPaginatedSubmissions.map((submission: any) => <Card key={submission.id} className="p-4 sm:p-6">
                            <div className="space-y-4">
                              {/* Layout Mobile e Desktop */}
                              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                {/* Checkbox de seleção */}
                                <div className="flex items-start pt-2 order-1 sm:order-1">
                                  <Checkbox checked={selectedSubmissions.has(submission.id)} onCheckedChange={() => toggleSubmissionSelection(submission.id)} />
                                </div>

                                {/* Screenshots */}
                                <div className="w-full sm:w-48 flex-shrink-0 order-2 sm:order-2 space-y-2">
                                  {/* Screenshot principal (post/venda) */}
                                  <div className="h-64 sm:h-48 cursor-pointer" onClick={() => handleOpenZoom(submission.id)}>
                                    <Suspense fallback={<Skeleton className="w-full h-full rounded-lg" />}>
                                      <SubmissionImageDisplay screenshotPath={submission.screenshot_path} screenshotUrl={submission.screenshot_url} alt="Screenshot da postagem" className="w-full h-full object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                                    </Suspense>
                                  </div>

                                  {/* 🆕 Screenshot do perfil (se existir) */}
                                  {submission.profile_screenshot_path && <div className="h-40 sm:h-32">
                                      <Suspense fallback={<Skeleton className="w-full h-full rounded-lg" />}>
                                        <SubmissionImageDisplay screenshotPath={submission.profile_screenshot_path} alt="Screenshot do perfil" className="w-full h-full object-cover rounded-lg border opacity-80" />
                                      </Suspense>
                                      <p className="text-xs text-muted-foreground text-center mt-1">Print do Perfil</p>
                                    </div>}

                                  {/* 🆕 Faixa de seguidores (se existir) */}
                                  {submission.followers_range && <div className="bg-primary/10 rounded px-2 py-1 text-center">
                                      <p className="text-xs font-medium text-primary">
                                        👥 {submission.followers_range}
                                      </p>
                                    </div>}
                                </div>

                                {/* Informações do usuário */}
                                <div className="flex-1 space-y-3 order-3 sm:order-3">
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                    <div>
                                      <h3 className="font-bold text-lg">
                                        {submission.profiles?.full_name || "Nome não disponível"}
                                      </h3>
                                      <p className="text-sm text-muted-foreground">
                                        {submission.profiles?.email || "Email não disponível"}
                                      </p>
                                      {submission.profiles?.instagram && <a href={`https://instagram.com/${submission.profiles.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary mt-1 hover:underline cursor-pointer inline-block">
                                          {submission.profiles.instagram.startsWith("@") ? submission.profiles.instagram : `@${submission.profiles.instagram}`}
                                        </a>}
                                    </div>
                                    <div className="sm:text-right">
                                      <div className="flex flex-col sm:items-end gap-2">
                                        {/* ✅ FASE 5: Dropdown para trocar evento */}
                                        <div className="space-y-1">
                                          <label className="text-sm text-muted-foreground">Evento:</label>
                                          <Select value={submission.event_id || "none"} onValueChange={async newEventId => {
                                    if (newEventId === "none") return;
                                    const currentEvent = events.find(e => e.id === submission.event_id);
                                    const newEvent = events.find(e => e.id === newEventId);
                                    const confirma = window.confirm(`Deseja mover esta submissão de:\n"${currentEvent?.title}" → "${newEvent?.title}"?\n\nO post será resetado e deverá ser selecionado novamente.\n\nEsta ação não pode ser desfeita.`);
                                    if (!confirma) return;
                                    try {
                                      const {
                                        error
                                      } = await sb.from("submissions").update({
                                        event_id: newEventId,
                                        post_id: null,
                                        submission_type: "divulgacao"
                                      }).eq("id", submission.id);
                                      if (error) throw error;
                                      toast.success(`✅ Submissão movida para: ${newEvent?.title}`);
                                      refetchSubmissions();
                                    } catch (err: any) {
                                      console.error("Erro ao trocar evento:", err);
                                      toast.error(`❌ Erro: ${err.message}`);
                                    }
                                  }} disabled={isReadOnly}>
                                            <SelectTrigger className="w-48 h-8 text-xs">
                                              <SelectValue>
                                                {events.find(e => e.id === submission.event_id)?.title || "Selecione evento"}
                                              </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                              {events.filter(e => e.is_active).map(event => <SelectItem key={event.id} value={event.id}>
                                                    📅 {event.title}
                                                  </SelectItem>)}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {/* ✅ ITEM 4: Dropdown editável para trocar post_id */}
                                        <div className="flex items-center gap-2">
                                          <Select value={submission.post_id || "none"} onValueChange={async newPostId => {
                                    if (newPostId === "none") return;

                                    // 🆕 FASE 4: Tratar seleção de venda especial
                                    if (newPostId === "__SALE__") {
                                      const confirma = window.confirm(`Deseja alterar para "Vendas"?\n\nEsta ação não pode ser desfeita.`);
                                      if (!confirma) return;
                                      try {
                                        // ✅ FASE 4: Buscar event_id do post atual para manter rastreabilidade
                                        const currentPost = posts.find(p => p.id === submission.post_id);
                                        const eventId = currentPost?.event_id || null;
                                        const {
                                          error
                                        } = await sb.from("submissions").update({
                                          post_id: null,
                                          submission_type: "sale",
                                          event_id: eventId // ✅ Manter event_id mesmo sem post_id
                                        }).eq("id", submission.id);
                                        if (error) throw error;
                                        toast.success(`✅ Post alterado para: Vendas`);
                                        refetchSubmissions();
                                      } catch (err: any) {
                                        console.error("Erro ao atualizar post:", err);
                                        toast.error(`❌ Erro: ${err.message}`);
                                      }
                                      return;
                                    }

                                    // Para posts normais
                                    const postAtual = posts.find(p => p.id === submission.post_id);
                                    const postNovo = posts.find(p => p.id === newPostId);
                                    const nomeAtual = postAtual ? formatPostName(postAtual.post_type, postAtual.post_number) : "Vendas";
                                    const nomeNovo = postNovo ? formatPostName(postNovo.post_type, postNovo.post_number) : "Vendas";
                                    const confirma = window.confirm(`Deseja alterar o post de "${nomeAtual}" para "${nomeNovo}"?\n\nEsta ação não pode ser desfeita.`);
                                    if (!confirma) return;
                                    try {
                                      // Atualizar post_id e submission_type automaticamente
                                      const updates: any = {
                                        post_id: newPostId,
                                        submission_type: "divulgacao"
                                      };
                                      const {
                                        error
                                      } = await sb.from("submissions").update(updates).eq("id", submission.id);
                                      if (error) throw error;
                                      toast.success(`✅ Post alterado para: ${nomeNovo}`);
                                      refetchSubmissions();
                                    } catch (err: any) {
                                      console.error("Erro ao atualizar post:", err);
                                      toast.error(`❌ Erro: ${err.message}`);
                                    }
                                  }} disabled={isReadOnly}>
                                            <SelectTrigger className="w-48 h-8 text-xs">
                                              <SelectValue>
                                                {submission.submission_type === "sale" ? "💰 Comprovante de Venda" : `📱 ${formatPostName(submission.posts?.post_type, submission.posts?.post_number || 0)}`}
                                              </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                              {(() => {
                                        // Buscar evento da submissão atual
                                        const currentPost = posts.find(p => p.id === submission.post_id);
                                        const eventId = currentPost?.event_id;
                                        const currentEvent = events.find(e => e.id === eventId);
                                        const items = [];

                                        // 🆕 FASE 4: Se evento aceita vendas, adicionar opção especial
                                        if (currentEvent?.accept_sales) {
                                          items.push(<SelectItem key="sale-option" value="__SALE__">
                                                      💰 Comprovante de Venda
                                                    </SelectItem>);
                                        }

                                        // Adicionar posts normais (filtrar posts de venda para evitar duplicata)
                                        const eventPosts = posts.filter(p => p.event_id === eventId).filter(post => post.post_type !== "sale"); // 🆕 FASE 4: Filtrar posts de venda

                                        eventPosts.forEach(post => {
                                          items.push(<SelectItem key={post.id} value={post.id}>
                                                      📱 {formatPostName(post.post_type, post.post_number)}
                                                    </SelectItem>);
                                        });
                                        return items;
                                      })()}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <p className="text-xs text-muted-foreground">
                                          {
                                  // Suporte para events como objeto ou array
                                  Array.isArray(submission.posts?.events) ? submission.posts?.events[0]?.title || "N/A" : submission.posts?.events?.title || "N/A"}
                                        </p>
                                      </div>
                                      <div className="mt-2">
                                        {submission.status === "pending" && <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-500">
                                            Aguardando
                                          </span>}
                                        {submission.status === "approved" && <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-500">
                                            Aprovado
                                          </span>}
                                        {submission.status === "rejected" && <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-500">
                                            Rejeitado
                                          </span>}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border-t pt-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <p className="text-muted-foreground">Data de Envio:</p>
                                        <p className="font-medium">
                                          {new Date(submission.submitted_at).toLocaleString("pt-BR")}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Prazo da Postagem:</p>
                                        <p className="font-medium">
                                          {submission.posts?.deadline ? new Date(submission.posts.deadline).toLocaleString("pt-BR") : "N/A"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Total de Postagens:</p>
                                        <p className="font-medium text-primary">
                                          {submission.total_submissions} postagem
                                          {submission.total_submissions !== 1 ? "s" : ""}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border-t pt-3 flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1">
                                      <label className="text-sm text-muted-foreground mb-1 block">
                                        Status da Submissão:
                                      </label>
                                      <Select value={submission.status} onValueChange={newStatus => handleStatusChangeWrapper(submission.id, newStatus)}>
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Aguardando aprovação</SelectItem>
                                          <SelectItem value="approved">Aprovado</SelectItem>
                                          <SelectItem value="rejected">Rejeitado</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex items-end">
                                      <Button variant="outline" size="sm" onClick={() => setAuditLogSubmissionId(submission.id)}>
                                        Ver Histórico
                                      </Button>
                                    </div>
                                  </div>

                                  {submission.status === "pending" && <div className="border-t pt-3 flex flex-col sm:flex-row gap-2">
                                      <Button size="sm" className="bg-green-500 hover:bg-green-600 w-full sm:w-auto" onClick={() => handleApproveSubmission(submission.id)} disabled={isReadOnly}>
                                        <Check className="mr-2 h-4 w-4" />
                                        Aprovar
                                      </Button>
                                      <Button size="sm" variant="destructive" className="w-full sm:w-auto" onClick={() => handleRejectSubmission(submission.id)} disabled={isReadOnly}>
                                        <X className="mr-2 h-4 w-4" />
                                        Rejeitar
                                      </Button>
                                    </div>}

                                  {/* Botão de deletar sempre visível */}
                                  <div className="border-t pt-3">
                                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto" onClick={() => setSubmissionToDelete(submission.id)}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Deletar Submissão
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* Seção de Comentários */}
                              <div className="border-t pt-4">
                                <Button variant="ghost" size="sm" onClick={() => toggleExpandedComment(submission.id)} className="mb-3">
                                  {expandedComments.has(submission.id) ? "Ocultar" : "Mostrar"} Comentários
                                </Button>

                                {expandedComments.has(submission.id) && <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                                    <SubmissionComments submissionId={submission.id} onCommentAdded={refetchSubmissions} />
                                  </Suspense>}
                              </div>
                            </div>
                          </Card>)}
                      </div>

                      {/* Paginação */}
                      {totalPages > 1 && <div className="flex items-center justify-between mt-6 pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                            {Math.min(currentPage * itemsPerPage, submissionsCount || 0)} de{" "}
                            {submissionsCount || 0} submissões
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                              Anterior
                            </Button>
                            <div className="flex items-center gap-1">
                              {Array.from({
                        length: Math.min(5, totalPages)
                      }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(pageNum)} className="w-10">
                                      {pageNum}
                                    </Button>;
                      })}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                              Próxima
                            </Button>
                          </div>
                        </div>}
                    </>}
                </Card>
              </>}
          </TabsContent>

          {/* ✅ FASE 5: Tabs refatorados */}
          <AdminUsersTab />
          <AdminGuestsTab agencyId={currentAgency?.id} />
          <AdminGuestListTab />
          <AdminAuditTab agencyId={currentAgency?.id} />

          {/* ✅ FASE 5.3: AdminStatsTab integrado */}
          <AdminStatsTab
            events={events}
            filteredEvents={filteredEvents}
            globalStatsEventFilter={globalStatsEventFilter}
            globalSelectedEventId={globalSelectedEventId}
            agencyId={currentAgency?.id}
            profileAgencyId={profile?.agency_id}
            onFilterChange={setGlobalStatsEventFilter}
            onEventChange={setGlobalSelectedEventId}
          />

          {/* Push analytics desativado - sistema push desabilitado */}

          {/* ✅ FASE 5: Tab de Settings refatorado */}
          <AdminSettingsTab 
            isMasterAdmin={isMasterAdmin || false} 
            currentAgencyId={currentAgency?.id} 
          />
        </Tabs>
      </div>

      {/* ✅ FASE 5.5: Componente consolidado de diálogos */}
      <AdminDialogs
        // Event Dialog
        eventDialogOpen={eventDialogOpen}
        setEventDialogOpen={setEventDialogOpen}
        selectedEvent={selectedEvent}
        setSelectedEvent={setSelectedEvent}
        onEventCreated={() => {
          refetchEvents();
          if (submissionEventFilter !== "all") refetchSubmissions();
        }}
        // Post Dialog
        postDialogOpen={postDialogOpen}
        setPostDialogOpen={setPostDialogOpen}
        selectedPost={selectedPost}
        setSelectedPost={setSelectedPost}
        onPostCreated={() => {
          refetchEvents();
          if (submissionEventFilter !== "all") refetchSubmissions();
        }}
        // Rejection Dialog
        rejectionDialogOpen={rejectionDialogOpen}
        setRejectionDialogOpen={setRejectionDialogOpen}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        rejectionTemplate={rejectionTemplate}
        setRejectionTemplate={setRejectionTemplate}
        rejectionTemplatesFromDB={rejectionTemplatesFromDB}
        onConfirmRejection={confirmRejection}
        // Audit Log Dialog
        auditLogSubmissionId={auditLogSubmissionId}
        setAuditLogSubmissionId={setAuditLogSubmissionId}
        // Delete Event Dialog
        eventToDelete={eventToDelete}
        setEventToDelete={setEventToDelete}
        onDeleteEvent={handleDeleteEvent}
        // Delete Post Dialog
        postToDelete={postToDelete}
        setPostToDelete={setPostToDelete}
        onDeletePost={handleDeletePostWrapper}
        // Delete Submission Dialog
        submissionToDelete={submissionToDelete}
        setSubmissionToDelete={setSubmissionToDelete}
        onDeleteSubmission={handleDeleteSubmissionWrapper}
        // Image Zoom Dialog
        selectedImageForZoom={selectedImageForZoom}
        setSelectedImageForZoom={setSelectedImageForZoom}
        // Manual Submission Dialog
        addSubmissionDialogOpen={addSubmissionDialogOpen}
        setAddSubmissionDialogOpen={setAddSubmissionDialogOpen}
        onSubmissionSuccess={() => {
          refetchSubmissions();
          toast.success("Submissão adicionada com sucesso!");
        }}
        submissionEventFilter={submissionEventFilter}
        // Zoom Dialog
        zoomDialogOpen={zoomDialogOpen}
        setZoomDialogOpen={setZoomDialogOpen}
        zoomSubmission={getPaginatedSubmissions.length > 0 && zoomSubmissionIndex < getPaginatedSubmissions.length ? getPaginatedSubmissions[zoomSubmissionIndex] : null}
        onZoomApprove={handleApproveSubmission}
        onZoomReject={handleRejectSubmission}
        onZoomNext={handleZoomNext}
        onZoomPrevious={handleZoomPrevious}
        hasNext={zoomSubmissionIndex < getPaginatedSubmissions.length - 1}
        hasPrevious={zoomSubmissionIndex > 0}
        // Suggestion Dialog
        suggestionDialogOpen={suggestionDialogOpen}
        setSuggestionDialogOpen={setSuggestionDialogOpen}
        userId={user?.id || ""}
        agencyId={currentAgency?.id}
        // Column Selection Dialog
        showColumnSelectionDialog={showColumnSelectionDialog}
        setShowColumnSelectionDialog={setShowColumnSelectionDialog}
        availableExportColumns={availableExportColumns}
        selectedExportColumns={selectedExportColumns}
        setSelectedExportColumns={setSelectedExportColumns}
        onExecuteExport={executeExport}
      />
    </div>;
};
export default Admin;