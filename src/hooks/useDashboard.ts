import { useQuery } from "@tanstack/react-query";
import { sb } from "@/lib/supabaseSafe";
import { useAuthStore } from "@/stores/authStore";

interface EventStats {
  eventId: string;
  eventTitle: string;
  totalRequired: number;
  submitted: number;
  percentage: number;
  isApproximate: boolean;
}

export const useDashboard = (agencyId: string | null | undefined) => {
  // 🔧 Aceitar undefined
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ["dashboard", user?.id, agencyId],
    queryFn: async () => {
      if (!user) {
        console.log("❌ useDashboard: Sem user");
        return null;
      }

      if (!agencyId) {
        console.log("⚠️ useDashboard: Aguardando agencyId...");
        return null; // Não é erro, apenas aguardando
      }

      console.log("🔄 [useDashboard] Iniciando query:", {
        userId: user.id,
        agencyId,
        enabled: !!user && !!agencyId,
      });

      console.log("🔄 [useDashboard] Carregando dados em paralelo...");
      const startTime = performance.now();

      // ✅ 1 ÚNICA QUERY com Promise.all - Carregamento paralelo
      const [profileRes, rolesRes, submissionsRes, eventsRes] = await Promise.all([
        // Query 1: Perfil completo
        sb.from("profiles").select("*").eq("id", user.id).single(),

        // Query 2: Roles (1 vez só)
        sb.from("user_roles").select("role").eq("user_id", user.id),

        // Query 3: Submissions
        sb
          .from("submissions")
          .select(
            `
            id,
            submitted_at,
            screenshot_url,
            screenshot_path,
            status,
            rejection_reason,
            posts!inner (
              post_number,
              deadline,
              event_id,
              events!inner (
                title,
                required_posts,
                id,
                is_active,
                agency_id,
                total_required_posts,
                is_approximate_total
              )
            )
          `,
          )
          .eq("user_id", user.id)
          .eq("posts.events.is_active", true)
          .eq("posts.events.agency_id", agencyId)
          .order("submitted_at", { ascending: false }),

        // Query 4: Eventos ativos
        sb
          .from("events")
          .select("id, title, total_required_posts, is_approximate_total")
          .eq("is_active", true)
          .eq("agency_id", agencyId)
          .order("event_date", { ascending: false }),
      ]);

      const endTime = performance.now();
      console.log(`✅ [useDashboard] Dados carregados em ${(endTime - startTime).toFixed(0)}ms`);

      // Processar dados
      const profile = profileRes.data;
      const roles = rolesRes.data?.map((r) => r.role) || [];
      const submissions = submissionsRes.data || [];
      const events = eventsRes.data || [];

      console.log("📊 Dados carregados:", {
        profile: profile?.full_name || "(vazio)",
        roles: roles.join(", ") || "(nenhuma)",
        submissions: submissions.length,
        events: events.length,
      });

      // Calcular estatísticas sem query adicional
      const eventStats = calculateEventStats(submissions);

      return {
        profile,
        roles,
        submissions,
        events,
        eventStats,
        isMasterAdmin: roles.includes("master_admin"),
        isAgencyAdmin: roles.includes("agency_admin"),
      };
    },
    enabled: !!user && agencyId !== undefined, // 🔧 Permitir null, bloquear apenas undefined
    staleTime: 5 * 60 * 1000, // Cache 5 min
    gcTime: 10 * 60 * 1000, // Mantém em memória 10 min
    refetchOnWindowFocus: false,
    refetchOnMount: false, // ✅ CRÍTICO: Não refetch se já tem cache
  });
};

function calculateEventStats(submissions: any[]): EventStats[] {
  const eventMap = new Map<
    string,
    { title: string; totalPosts: number; approvedCount: number; isApproximate: boolean }
  >();

  submissions.forEach((sub) => {
    if (sub.posts?.events) {
      const eventId = (sub.posts.events as any).id;
      const eventData = sub.posts.events as any;

      if (!eventMap.has(eventId)) {
        eventMap.set(eventId, {
          title: eventData.title,
          totalPosts: eventData.total_required_posts || 0,
          approvedCount: 0,
          isApproximate: eventData.is_approximate_total || false,
        });
      }

      if (sub.status === "approved") {
        const current = eventMap.get(eventId)!;
        current.approvedCount++;
      }
    }
  });

  return Array.from(eventMap.entries()).map(([eventId, data]) => ({
    eventId,
    eventTitle: data.title,
    totalRequired: data.totalPosts,
    submitted: data.approvedCount,
    percentage: data.totalPosts > 0 ? (data.approvedCount / data.totalPosts) * 100 : 0,
    isApproximate: data.isApproximate,
  }));
}
