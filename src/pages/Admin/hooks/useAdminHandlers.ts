/**
 * Hook consolidado para handlers do Admin
 * Centraliza handlers de UI, navegação e ações diversas
 */
import { useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { sb } from "@/lib/supabaseSafe";
import { logger } from "@/lib/logger";

// Export columns definition
export const AVAILABLE_EXPORT_COLUMNS = [
  { key: "tipo", label: "Tipo" },
  { key: "evento", label: "Evento" },
  { key: "numero_postagem", label: "Número da Postagem" },
  { key: "nome", label: "Nome" },
  { key: "instagram", label: "Instagram" },
  { key: "email", label: "Email" },
  { key: "telefone", label: "Telefone" },
  { key: "genero", label: "Gênero" },
  { key: "seguidores", label: "Seguidores" },
  { key: "status", label: "Status" },
  { key: "data_envio", label: "Data de Envio" },
  { key: "total_submissoes_aprovadas", label: "Total de Submissões Aprovadas" },
  { key: "vendas_aprovadas_evento", label: "Vendas Aprovadas no Evento" },
  { key: "email_ticketeira", label: "E-mail da Ticketeira" },
  { key: "motivo_rejeicao", label: "Motivo Rejeição" },
  { key: "status_participante", label: "Status do Participante" },
];

// Rejection templates
export const REJECTION_TEMPLATES = [
  { value: "formato", label: "Imagem fora do padrão" },
  { value: "conteudo", label: "Post não relacionado ao evento" },
  { value: "prazo", label: "Prazo expirado" },
  { value: "qualidade", label: "Qualidade da imagem inadequada" },
  { value: "outro", label: "Outro (especificar abaixo)" },
];

export interface UseAdminHandlersParams {
  // Submissions data
  submissions: any[];
  paginatedSubmissions: any[];
  
  // State setters
  setZoomDialogOpen: (open: boolean) => void;
  setZoomSubmissionIndex: (index: number) => void;
  setShowColumnSelectionDialog: (open: boolean) => void;
  setSelectedExportColumns: (columns: string[]) => void;
  
  // Filters
  submissionEventFilter: string;
  submissionPostFilter: string;
  dateFilterStart: string;
  dateFilterEnd: string;
  
  // Events data
  events: any[];
}

export const useAdminHandlers = ({
  submissions,
  paginatedSubmissions,
  setZoomDialogOpen,
  setZoomSubmissionIndex,
  setShowColumnSelectionDialog,
  setSelectedExportColumns,
  submissionEventFilter,
  submissionPostFilter,
  dateFilterStart,
  dateFilterEnd,
  events,
}: UseAdminHandlersParams) => {
  const navigate = useNavigate();

  // ========== Zoom Handlers ==========
  const handleOpenZoom = useCallback((submissionId: string) => {
    const index = paginatedSubmissions.findIndex((s: any) => s.id === submissionId);
    if (index !== -1) {
      setZoomSubmissionIndex(index);
      setZoomDialogOpen(true);
    }
  }, [paginatedSubmissions, setZoomSubmissionIndex, setZoomDialogOpen]);

  const handleZoomNext = useCallback((currentIndex: number) => {
    if (currentIndex < paginatedSubmissions.length - 1) {
      setZoomSubmissionIndex(currentIndex + 1);
    }
  }, [paginatedSubmissions.length, setZoomSubmissionIndex]);

  const handleZoomPrevious = useCallback((currentIndex: number) => {
    if (currentIndex > 0) {
      setZoomSubmissionIndex(currentIndex - 1);
    }
  }, [setZoomSubmissionIndex]);

  // ========== Export Handlers ==========
  const handleExportToExcel = useCallback(() => {
    if (submissionEventFilter === "all" || !submissionEventFilter) {
      toast.error("⚠️ Selecione um evento específico para exportar");
      return;
    }

    setSelectedExportColumns(AVAILABLE_EXPORT_COLUMNS.map(col => col.key));
    setShowColumnSelectionDialog(true);
  }, [submissionEventFilter, setSelectedExportColumns, setShowColumnSelectionDialog]);

  const executeExport = useCallback(async (selectedColumns: string[]) => {
    try {
      const XLSX = await import("xlsx");

      if (submissionEventFilter === "all" || !submissionEventFilter) {
        toast.error("⚠️ Selecione um evento específico para exportar");
        return;
      }

      toast.info("🔄 Buscando todas as submissões do evento...");

      const { data: allEventSubmissions, error: fetchError } = await sb.from("submissions")
        .select(`*, posts(id, post_number, deadline, event_id, post_type)`)
        .eq("event_id", submissionEventFilter)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("❌ Erro ao buscar submissões:", fetchError);
        toast.error("Erro ao buscar submissões para exportação");
        return;
      }

      let freshSubmissions = allEventSubmissions || [];

      if (!freshSubmissions || freshSubmissions.length === 0) {
        toast.error(`❌ Nenhuma submissão encontrada para o evento selecionado`);
        return;
      }

      // Apply client-side filters
      if (submissionPostFilter && submissionPostFilter !== "all") {
        freshSubmissions = freshSubmissions.filter((s: any) => 
          s.posts?.post_number?.toString() === submissionPostFilter
        );
      }

      if (dateFilterStart) {
        freshSubmissions = freshSubmissions.filter((s: any) => {
          const submitDate = new Date(s.submitted_at);
          const filterDate = new Date(dateFilterStart);
          return submitDate >= filterDate;
        });
      }

      if (dateFilterEnd) {
        freshSubmissions = freshSubmissions.filter((s: any) => {
          const submitDate = new Date(s.submitted_at);
          const filterDate = new Date(dateFilterEnd);
          return submitDate <= filterDate;
        });
      }

      if (freshSubmissions.length === 0) {
        toast.error(`❌ Nenhuma submissão encontrada com os filtros aplicados`);
        return;
      }

      // Fetch profiles
      const userIds = [...new Set(freshSubmissions.map((s: any) => s.user_id))];
      
      const chunkArray = <T,>(array: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
      };

      const userIdChunks = chunkArray(userIds as string[], 30);
      const profilesResults = await Promise.all(
        userIdChunks.map(chunk => 
          sb.from("profiles")
            .select("id, full_name, instagram, email, phone, gender, followers_range")
            .in("id", chunk)
            .then(res => res.data || [])
        )
      );
      const profilesData = profilesResults.flat();

      const profilesMap: Record<string, any> = {};
      (profilesData || []).forEach(profile => {
        profilesMap[profile.id] = profile;
      });

      // Fetch participation status
      const { data: participationData } = await sb.from("user_event_goals")
        .select("user_id, participation_status, goal_achieved, manual_approval")
        .eq("event_id", submissionEventFilter)
        .in("user_id", userIds as string[]);

      const participationMap: Record<string, any> = {};
      (participationData || []).forEach((p: any) => {
        participationMap[p.user_id] = p;
      });

      // Fetch approved counts
      const { data: approvedCountsData } = await sb.from("submissions")
        .select("user_id, post_id, posts!inner(event_id)")
        .in("user_id", userIds as string[])
        .eq("status", "approved")
        .eq("submission_type", "divulgacao")
        .eq("posts.event_id", submissionEventFilter);

      const approvedCountsMap: Record<string, number> = {};
      (approvedCountsData || []).forEach((item: any) => {
        approvedCountsMap[item.user_id] = (approvedCountsMap[item.user_id] || 0) + 1;
      });

      // Fetch event sales
      const { data: eventSalesData } = await sb.from("submissions")
        .select("user_id")
        .in("user_id", userIds as string[])
        .eq("event_id", submissionEventFilter)
        .eq("submission_type", "sale")
        .eq("status", "approved");

      const eventSalesMap: Record<string, number> = {};
      (eventSalesData || []).forEach((item: any) => {
        if (item.user_id) {
          eventSalesMap[item.user_id] = (eventSalesMap[item.user_id] || 0) + 1;
        }
      });

      // Prepare export data
      const fullExportData = freshSubmissions.map((sub: any) => {
        const profile = profilesMap[sub.user_id] || {};
        const participation = participationMap[sub.user_id];

        return {
          tipo: sub.submission_type === "divulgacao" ? "Divulgação" : "Venda",
          evento: events.find(e => e.id === submissionEventFilter)?.title || "Evento",
          numero_postagem: sub.posts?.post_number || 0,
          nome: profile.full_name || "N/A",
          instagram: profile.instagram ? `https://instagram.com/${profile.instagram.replace("@", "")}` : "N/A",
          email: profile.email || "N/A",
          telefone: profile.phone || "N/A",
          genero: profile.gender || "N/A",
          seguidores: profile.followers_range || "N/A",
          status: sub.status === "approved" ? "Aprovado" : sub.status === "rejected" ? "Rejeitado" : "Pendente",
          data_envio: new Date(sub.submitted_at).toLocaleString("pt-BR"),
          total_submissoes_aprovadas: approvedCountsMap[sub.user_id] || 0,
          vendas_aprovadas_evento: eventSalesMap[sub.user_id] || 0,
          email_ticketeira: sub.user_ticketer_email || "N/A",
          motivo_rejeicao: sub.rejection_reason || "N/A",
          status_participante: (() => {
            if (!participation) return "Em Progresso";
            if (participation.participation_status === 'withdrawn') return "Removida";
            if (participation.manual_approval) return "Aprovada Agência";
            if (participation.goal_achieved) return "Bateu Meta";
            return "Em Progresso";
          })(),
        };
      });

      // Filter columns
      const columnLabelsMap: Record<string, string> = {};
      AVAILABLE_EXPORT_COLUMNS.forEach(col => {
        columnLabelsMap[col.key] = col.label;
      });

      const exportData = fullExportData.map((row: any) => {
        const filteredRow: Record<string, any> = {};
        selectedColumns.forEach(colKey => {
          const label = columnLabelsMap[colKey];
          if (label && row.hasOwnProperty(colKey)) {
            filteredRow[label] = row[colKey];
          }
        });
        return filteredRow;
      });

      // Create and download
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Submissões");

      const eventName = events.find(e => e.id === submissionEventFilter)?.title || "filtradas";
      XLSX.writeFile(wb, `submissoes_${eventName}_${new Date().toISOString().split("T")[0]}.xlsx`);

      toast.success(`${exportData.length} submissão(ões) exportada(s) com sucesso!`);
      setShowColumnSelectionDialog(false);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar submissões");
    }
  }, [submissionEventFilter, submissionPostFilter, dateFilterStart, dateFilterEnd, events, setShowColumnSelectionDialog]);

  // ========== Filtered Submissions ==========
  const getFilteredSubmissions = useMemo(() => {
    let filtered = submissions;

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
  }, [submissions, dateFilterStart, dateFilterEnd]);

  // ========== Zoom Index Persistence ==========
  useEffect(() => {
    const savedIndex = sessionStorage.getItem("adminZoomIndex");
    if (savedIndex && !isNaN(Number(savedIndex))) {
      setZoomSubmissionIndex(Number(savedIndex));
    }
  }, [setZoomSubmissionIndex]);

  return {
    // Zoom handlers
    handleOpenZoom,
    handleZoomNext,
    handleZoomPrevious,

    // Export handlers
    handleExportToExcel,
    executeExport,

    // Filtered data
    getFilteredSubmissions,

    // Constants
    availableExportColumns: AVAILABLE_EXPORT_COLUMNS,
    rejectionTemplates: REJECTION_TEMPLATES,
  };
};

export type UseAdminHandlersReturn = ReturnType<typeof useAdminHandlers>;
