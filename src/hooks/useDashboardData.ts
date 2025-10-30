import { useState, useCallback } from "react";
import { sb } from "@/lib/supabaseSafe";
import { useToast } from "@/hooks/use-toast";

interface EventStats {
  eventId: string;
  eventTitle: string;
  totalRequired: number;
  submitted: number;
  percentage: number;
  isApproximate: boolean;
}

interface Submission {
  id: string;
  submitted_at: string;
  screenshot_url: string;
  screenshot_path?: string;
  status: string;
  rejection_reason?: string;
  posts: {
    post_number: number;
    deadline: string;
    event_id: string;
    events: {
      title: string;
      required_posts: number;
    } | null;
  } | null;
}

export const useDashboardData = (userId: string | undefined, currentAgencyId: string | null) => {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [eventStats, setEventStats] = useState<EventStats[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!userId || !currentAgencyId) return;

    setLoading(true);

    try {
      // Carregar eventos ativos da agência atual
      const { data: eventsData } = await sb
        .from("events")
        .select("id, title")
        .eq("is_active", true)
        .eq("agency_id", currentAgencyId)
        .order("event_date", { ascending: false });

      setEvents(eventsData || []);

      // Carregar submissões
      const { data: submissionsData } = await sb
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
              agency_id
            )
          )
        `
        )
        .eq("user_id", userId)
        .eq("posts.events.is_active", true)
        .eq("posts.events.agency_id", currentAgencyId)
        .order("submitted_at", { ascending: false });

      setSubmissions(submissionsData || []);

      // Calcular estatísticas por evento
      if (submissionsData) {
        const eventMap = new Map<
          string,
          { title: string; totalPosts: number; approvedCount: number; isApproximate: boolean }
        >();

        const uniqueEventIds = new Set<string>();
        submissionsData.forEach((sub) => {
          if (sub.posts?.events) {
            const eventId = (sub.posts.events as any).id;
            uniqueEventIds.add(eventId);
          }
        });

        for (const eventId of Array.from(uniqueEventIds)) {
          const eventData = submissionsData.find(
            (sub) => sub.posts?.events && (sub.posts.events as any).id === eventId
          )?.posts?.events;

          if (eventData) {
            const { data: fullEventData } = await sb
              .from("events")
              .select("total_required_posts, is_approximate_total")
              .eq("id", eventId)
              .single();

            const totalRequiredPosts = fullEventData?.total_required_posts || 0;
            const isApproximate = fullEventData?.is_approximate_total || false;

            const approvedCount = submissionsData.filter(
              (sub) => sub.status === "approved" && sub.posts?.events && (sub.posts.events as any).id === eventId
            ).length;

            eventMap.set(eventId, {
              title: eventData.title,
              totalPosts: totalRequiredPosts,
              approvedCount: approvedCount,
              isApproximate: isApproximate,
            });
          }
        }

        const stats: EventStats[] = Array.from(eventMap.entries()).map(([eventId, data]) => ({
          eventId,
          eventTitle: data.title,
          totalRequired: data.totalPosts,
          submitted: data.approvedCount,
          percentage: data.totalPosts > 0 ? (data.approvedCount / data.totalPosts) * 100 : 0,
          isApproximate: data.isApproximate,
        }));

        setEventStats(stats);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do dashboard. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, currentAgencyId, toast]);

  return {
    submissions,
    eventStats,
    events,
    loading,
    loadDashboardData,
  };
};
