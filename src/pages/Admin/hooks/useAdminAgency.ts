/**
 * Hook consolidado para lógica de agência e trial do Admin
 * Centraliza carregamento de agência, profile, trial status
 */
import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sb } from "@/lib/supabaseSafe";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export interface TrialInfo {
  inTrial: boolean;
  expired: boolean;
  daysRemaining: number;
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
}

export interface UseAdminAgencyParams {
  userId: string | undefined;
  isMasterAdmin: boolean;
  isAgencyAdmin: boolean;
}

export const useAdminAgency = ({
  userId,
  isMasterAdmin,
  isAgencyAdmin,
}: UseAdminAgencyParams) => {
  const queryClient = useQueryClient();

  const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [agencySlug, setAgencySlug] = useState<string>("");
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [usersCount, setUsersCount] = useState(0);
  const [rejectionTemplatesFromDB, setRejectionTemplatesFromDB] = useState<any[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // Loading states
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [hasLoadedSubmissions, setHasLoadedSubmissions] = useState(false);
  const [lastSubmissionFilter, setLastSubmissionFilter] = useState("");

  // Computed
  const isReadOnly = trialInfo?.expired || false;

  // ========== Load Agency by ID ==========
  const loadAgencyById = useCallback(async (id: string) => {
    const { data } = await sb.from("agencies")
      .select("id, name, slug, logo_url, subscription_plan, subscription_status, trial_start_date, trial_end_date")
      .eq("id", id)
      .maybeSingle();

    if (data) {
      setCurrentAgency(data);
      setAgencySlug(data.slug || "");
      logger.info("🏢 Master Admin visualizando agência:", data.name);
    }
  }, []);

  // ========== Load Agency by Slug ==========
  const loadAgencyBySlug = useCallback(async (slug: string) => {
    const { data } = await sb.from("agencies")
      .select("id, name, slug, logo_url, subscription_plan, subscription_status, trial_start_date, trial_end_date")
      .eq("slug", slug)
      .maybeSingle();

    if (data) {
      setCurrentAgency(data);
      setAgencySlug(data.slug || "");
    }
  }, []);

  // ========== Load Current Agency ==========
  const loadCurrentAgency = useCallback(async () => {
    if (!userId) return;
    logger.info("🔍 [loadCurrentAgency] Iniciando...");

    // Load user profile
    const { data: profileData, error: profileError } = await sb.from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      logger.error("❌ Erro ao carregar profile:", profileError);
      return;
    }

    logger.info("✅ Profile carregado:", {
      id: profileData?.id,
      email: profileData?.email,
      agency_id: profileData?.agency_id,
    });
    setProfile(profileData);

    // Check URL params
    const urlParams = new URLSearchParams(window.location.search);
    const agencySlugParam = urlParams.get("agency");
    const agencyIdParam = urlParams.get("agencyId");

    if (agencySlugParam) {
      const { data, error } = await sb.from("agencies")
        .select("id, name, slug, logo_url, subscription_plan, subscription_status, trial_start_date, trial_end_date")
        .eq("slug", agencySlugParam)
        .maybeSingle();

      if (error) {
        logger.error("❌ Erro ao carregar agência por slug:", error);
        return;
      }

      logger.info("🏢 Loaded agency from URL (slug):", data);
      setCurrentAgency(data);
      setAgencySlug(data?.slug || "");
      return;
    }

    if (agencyIdParam && isMasterAdmin) {
      const { data, error } = await sb.from("agencies")
        .select("id, name, slug, logo_url, subscription_plan, subscription_status, trial_start_date, trial_end_date")
        .eq("id", agencyIdParam)
        .maybeSingle();

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

      const { data: agencyData, error: agencyError } = await sb.from("agencies")
        .select("id, name, slug, logo_url, subscription_plan, subscription_status, trial_start_date, trial_end_date")
        .eq("id", profileData.agency_id)
        .maybeSingle();

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
    } else if (isMasterAdmin && !agencySlugParam && !agencyIdParam) {
      logger.info("👑 Master Admin sem filtro de agência - visualizando todos os dados");
    }
  }, [userId, isMasterAdmin, isAgencyAdmin]);

  // ========== Load Rejection Templates ==========
  const loadRejectionTemplates = useCallback(async () => {
    const { data } = await sb.from("rejection_templates")
      .select("*")
      .order("title");
    setRejectionTemplatesFromDB(data || []);
  }, []);

  // ========== Load Users Count ==========
  const loadUsersCount = useCallback(async () => {
    if (!userId) return;

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
      const { data: profileData } = await sb.from("profiles")
        .select("agency_id")
        .eq("id", userId)
        .maybeSingle();
      agencyIdFilter = profileData?.agency_id;
    }

    let countQuery = sb.from("profiles").select("*", { count: "exact", head: true });

    if (agencyIdFilter) {
      countQuery = countQuery.eq("agency_id", agencyIdFilter);
    }

    const { count } = await countQuery;
    setUsersCount(count || 0);
  }, [userId, isMasterAdmin, isAgencyAdmin, currentAgency]);

  // ========== Check Trial Status ==========
  const checkTrialStatus = useCallback(() => {
    if (!currentAgency) return;

    if (currentAgency.subscription_status === "trial") {
      const now = new Date();
      const endDate = currentAgency.trial_end_date ? new Date(currentAgency.trial_end_date) : null;

      if (endDate) {
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setTrialInfo({
          inTrial: daysRemaining > 0,
          expired: daysRemaining <= 0,
          daysRemaining: Math.max(0, daysRemaining),
        });
      }
    } else {
      setTrialInfo(null);
    }
  }, [currentAgency]);

  // ========== Copy Slug URL ==========
  const copySlugUrl = useCallback(() => {
    const url = `${window.location.origin}/agencia/${agencySlug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!", {
      description: "URL de cadastro copiada para a área de transferência",
    });
  }, [agencySlug]);

  // ========== Copy Event URL ==========
  const copyEventUrl = useCallback((eventSlug: string) => {
    const url = `${window.location.origin}/agencia/${agencySlug}/evento/${eventSlug}`;
    navigator.clipboard.writeText(url);
    toast.success("URL do Evento Copiada!", {
      description: "A URL pública do evento foi copiada para a área de transferência.",
    });
  }, [agencySlug]);

  // ========== Initialize Data ==========
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const agencySlugParam = urlParams.get("agency");
    const agencyIdParam = urlParams.get("agencyId");

    const initializeData = async () => {
      if (!userId || (!isAgencyAdmin && !isMasterAdmin)) return;
      logger.info("🚀 [Admin] Inicializando dados...");

      if (agencyIdParam && isMasterAdmin) {
        await loadAgencyById(agencyIdParam);
      } else if (agencySlugParam && (isAgencyAdmin || isMasterAdmin)) {
        await loadAgencyBySlug(agencySlugParam);
      } else {
        await loadCurrentAgency();
      }

      loadRejectionTemplates();
      loadUsersCount();
    };

    initializeData();
  }, [userId, isAgencyAdmin, isMasterAdmin, loadAgencyById, loadAgencyBySlug, loadCurrentAgency, loadRejectionTemplates, loadUsersCount]);

  // ========== Check Trial when Agency Changes ==========
  useEffect(() => {
    if (currentAgency) {
      checkTrialStatus();
      if (!hasLoadedInitialData) {
        loadUsersCount();
        setHasLoadedInitialData(true);
      }
    }
  }, [currentAgency, checkTrialStatus, loadUsersCount, hasLoadedInitialData]);

  // ========== Realtime Logo Updates ==========
  useEffect(() => {
    if (!currentAgency?.id) return;

    const channel = sb.channel("agency-logo-updates")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "agencies",
        filter: `id=eq.${currentAgency.id}`,
      }, (payload: any) => {
        logger.info("🔄 [Realtime] Agência atualizada:", payload.new);
        if (payload.new.logo_url !== currentAgency.logo_url) {
          logger.info("🖼️ [Realtime] Logo atualizado:", payload.new.logo_url);
          setCurrentAgency((prev: any) => ({
            ...prev,
            logo_url: payload.new.logo_url,
          }));
          toast.success("Logo atualizado!");
        }
      })
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [currentAgency?.id, currentAgency?.logo_url]);

  // ========== Invalidate Caches on Agency Change ==========
  useEffect(() => {
    if (currentAgency?.id) {
      logger.info("🔄 [Admin] Invalidando caches para agência:", currentAgency.id);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["submission-counters"] });
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    }
  }, [currentAgency?.id, queryClient]);

  return {
    currentAgency,
    setCurrentAgency,
    profile,
    agencySlug,
    trialInfo,
    usersCount,
    rejectionTemplatesFromDB,
    imageUrls,
    setImageUrls,
    isReadOnly,

    // Loading states
    hasLoadedInitialData,
    setHasLoadedInitialData,
    hasLoadedSubmissions,
    setHasLoadedSubmissions,
    lastSubmissionFilter,
    setLastSubmissionFilter,

    // Actions
    loadAgencyById,
    loadAgencyBySlug,
    loadCurrentAgency,
    loadRejectionTemplates,
    loadUsersCount,
    copySlugUrl,
    copyEventUrl,
  };
};

export type UseAdminAgencyReturn = ReturnType<typeof useAdminAgency>;
