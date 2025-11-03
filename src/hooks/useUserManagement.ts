import { useState, useCallback } from "react";
import { sb } from "@/lib/supabaseSafe";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  instagram: string | null;
  phone: string | null;
  created_at: string;
  gender?: string | null;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAgencyId, setCurrentAgencyId] = useState<string | null>(null);
  const [isMasterAdmin, setIsMasterAdmin] = useState<boolean | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [userEvents, setUserEvents] = useState<Record<string, string[]>>({});

  const checkAdminStatus = useCallback(async () => {
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;

    const { data: masterCheck } = await sb
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "master_admin")
      .maybeSingle();

    setIsMasterAdmin(!!masterCheck);

    if (!masterCheck) {
      const { data: agencyData } = await sb.from("agencies").select("id").eq("owner_id", user.id).maybeSingle();
      setCurrentAgencyId(agencyData?.id || null);
    }
  }, []);

  const loadUserEvents = async (userIds: string[]) => {
    if (userIds.length === 0) {
      setUserEvents({});
      return;
    }

    const { data } = await sb
      .from("submissions")
      .select(`
        user_id,
        posts!inner(
          events!inner(
            id,
            title
          )
        ),
        submission_type,
        status
      `)
      .in("user_id", userIds);

    const eventsMap: Record<string, string[]> = {};
    const salesMap: Record<string, number> = {};

    // ✅ CORRIGIDO: Inicializar TODOS os usuários (não apenas com submissões)
    userIds.forEach(userId => {
      eventsMap[userId] = [];  // ✅ Garante que TODOS têm array vazio
      salesMap[userId] = 0;
    });

    if (data) {
      data.forEach((submission: any) => {
        const userId = submission.user_id;
        const eventTitle = submission.posts?.events?.title;
        
        if (eventTitle && !eventsMap[userId].includes(eventTitle)) {
          eventsMap[userId].push(eventTitle);
        }
        
        if (submission.submission_type === 'sale' && submission.status === 'approved') {
          salesMap[userId] = (salesMap[userId] || 0) + 1;
        }
      });
    }

    console.log('📊 Usuários sem evento:', Object.entries(eventsMap).filter(([_, events]) => events.length === 0).length);
    console.log('📊 Total de usuários:', Object.keys(eventsMap).length);

    setUserEvents(eventsMap);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    
    try {
      let eventsQuery = sb
        .from("events")
        .select("id, title, is_active")
        .eq("is_active", true)
        .order("title");

      if (!isMasterAdmin && currentAgencyId) {
        eventsQuery = eventsQuery.eq("agency_id", currentAgencyId);
      }

      const { data: eventsData } = await eventsQuery;
      setEvents(eventsData || []);

      if (isMasterAdmin) {
        const { data, error } = await sb
          .from("profiles")
          .select("*, gender")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setUsers(data || []);

        if (data && data.length > 0) {
          await loadUserEvents(data.map((u) => u.id));
        }
    } else if (currentAgencyId) {
      // 🔧 CORREÇÃO 6: Buscar TODOS os usuários da agência (374), não apenas com submissões (323)
      console.log("👤 Agency Admin - carregando TODOS os usuários da agência:", currentAgencyId);
      
      const { data: profilesData, error: profilesError } = await sb
        .from("profiles")
        .select("*, gender")
        .eq("agency_id", currentAgencyId)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;
      
      console.log(`📊 Total de ${profilesData?.length || 0} usuários cadastrados na agência`);
      setUsers(profilesData || []);

      if (profilesData && profilesData.length > 0) {
        // Carregar eventos para TODOS os usuários (incluindo os sem submissões)
        await loadUserEvents(profilesData.map((u) => u.id));
      }
    } else {
      setUsers([]);
    }
    } catch (error) {
      toast.error("Erro ao carregar usuários", {
        description: "Não foi possível carregar a lista de usuários. Tente novamente.",
      });
      console.error("❌ Erro ao carregar usuários:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [isMasterAdmin, currentAgencyId, loadUserEvents]);

  return {
    users,
    loading,
    currentAgencyId,
    isMasterAdmin,
    events,
    userEvents,
    checkAdminStatus,
    loadUsers,
    setUsers,
  };
};
