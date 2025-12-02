import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserX, UserCheck, Filter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface Participant {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  current_posts: number;
  current_sales: number;
  required_posts: number;
  required_sales: number;
  goal_achieved: boolean;
  participation_status: string;
  withdrawn_reason: string | null;
  withdrawn_at: string | null;
}

interface ParticipantStatusManagerProps {
  eventId: string;
  eventTitle: string;
}

export const ParticipantStatusManager = ({ eventId, eventTitle }: ParticipantStatusManagerProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [withdrawalReason, setWithdrawalReason] = useState("");

  const fetchParticipants = async () => {
    setLoading(true);
    
    // Step 1: Buscar user_event_goals
    const { data: goalsData, error: goalsError } = await supabase
      .from("user_event_goals")
      .select(`
        user_id,
        current_posts,
        current_sales,
        required_posts,
        required_sales,
        goal_achieved,
        participation_status,
        withdrawn_reason,
        withdrawn_at
      `)
      .eq("event_id", eventId)
      .order("goal_achieved", { ascending: false })
      .order("current_posts", { ascending: false });

    if (goalsError) {
      toast.error("Erro ao carregar participantes");
      console.error(goalsError);
      setLoading(false);
      return;
    }

    if (!goalsData || goalsData.length === 0) {
      setParticipants([]);
      setFilteredParticipants([]);
      setLoading(false);
      return;
    }

    // Step 2: Buscar profiles correspondentes
    const userIds = goalsData.map(g => g.user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, phone, instagram")
      .in("id", userIds);

    if (profilesError) {
      console.error("Erro ao carregar perfis:", profilesError);
    }

    // Step 3: Combinar dados manualmente
    const profilesMap = new Map(
      (profilesData || []).map(p => [p.id, p])
    );

    const formatted = goalsData.map((g) => {
      const profile = profilesMap.get(g.user_id);
      return {
        user_id: g.user_id,
        full_name: profile?.full_name || "Sem nome",
        avatar_url: profile?.avatar_url || null,
        phone: profile?.phone || null,
        current_posts: g.current_posts,
        current_sales: g.current_sales,
        required_posts: g.required_posts,
        required_sales: g.required_sales,
        goal_achieved: g.goal_achieved,
        participation_status: g.participation_status || "active",
        withdrawn_reason: g.withdrawn_reason,
        withdrawn_at: g.withdrawn_at,
      };
    });

    setParticipants(formatted);
    setFilteredParticipants(formatted);
    setLoading(false);
  };

  useEffect(() => {
    fetchParticipants();
  }, [eventId]);

  useEffect(() => {
    let filtered = participants;

    // Aplicar filtro de status
    if (filter === "active") {
      filtered = filtered.filter(p => p.participation_status === "active");
    } else if (filter === "withdrawn") {
      filtered = filtered.filter(p => p.participation_status === "withdrawn");
    } else if (filter === "goal_achieved") {
      filtered = filtered.filter(p => p.goal_achieved);
    } else if (filter === "in_progress") {
      filtered = filtered.filter(p => !p.goal_achieved);
    }

    // Aplicar busca por nome em TODOS os dados (antes da paginação)
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredParticipants(filtered);
  }, [filter, searchTerm, participants]);

  // Paginação aplicada aos dados já filtrados
  const {
    paginatedItems: paginatedParticipants,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    previousPage,
    hasNextPage,
    hasPreviousPage,
  } = usePagination({
    items: filteredParticipants,
    itemsPerPage: 30,
  });

  const handleStatusChange = async (newStatus: "active" | "withdrawn") => {
    if (!selectedParticipant) return;

    const { error } = await supabase.rpc("update_participation_status", {
      p_user_id: selectedParticipant.user_id,
      p_event_id: eventId,
      p_status: newStatus,
      p_reason: newStatus === "withdrawn" ? withdrawalReason : null,
    });

    if (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
    } else {
      toast.success(
        newStatus === "withdrawn"
          ? "Participante marcada como removida"
          : "Participante reativada"
      );
      fetchParticipants();
      setDialogOpen(false);
      setWithdrawalReason("");
    }
  };

  const openDialog = (participant: Participant, newStatus: "active" | "withdrawn") => {
    setSelectedParticipant(participant);
    setDialogOpen(true);
    if (newStatus === "active") {
      handleStatusChange("active");
      setDialogOpen(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Gerenciar Participantes</h3>
          <p className="text-sm text-muted-foreground">Evento: {eventTitle}</p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Buscar por nome</Label>
            <Input
              id="search"
              placeholder="Digite o nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Label htmlFor="filter">Filtrar por</Label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger id="filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Participando</SelectItem>
                <SelectItem value="withdrawn">Removidas</SelectItem>
                <SelectItem value="goal_achieved">Bateram Meta</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Participantes */}
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : filteredParticipants.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum participante encontrado</p>
        ) : (
          <>
            <div className="space-y-2">
              {paginatedParticipants.map((participant) => (
                <div
                  key={participant.user_id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    participant.participation_status === "withdrawn"
                      ? "opacity-60 bg-muted/50"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar>
                      <AvatarImage src={participant.avatar_url || undefined} />
                      <AvatarFallback>
                        {participant.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{participant.full_name}</p>
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>Posts: {participant.current_posts}/{participant.required_posts}</span>
                          <span>Vendas: {participant.current_sales}/{participant.required_sales}</span>
                        </div>
                        {participant.phone && (
                          <p className="text-xs text-muted-foreground">
                            📱 {participant.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {participant.goal_achieved && (
                        <Badge variant="default" className="bg-green-600">Meta Batida</Badge>
                      )}
                      {participant.participation_status === "withdrawn" ? (
                        <Badge variant="destructive">Removida</Badge>
                      ) : (
                        <Badge variant="secondary">Participando</Badge>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    {participant.participation_status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(participant, "withdrawn")}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(participant, "active")}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Reativar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Controles de Paginação */}
            {totalPages > 1 && (
              <div className="mt-4">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  hasNextPage={hasNextPage}
                  hasPreviousPage={hasPreviousPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialog de Confirmação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Participante</DialogTitle>
            <DialogDescription>
              Você está removendo <strong>{selectedParticipant?.full_name}</strong> do evento.
              Esta participante não será mais contabilizada nas vagas ocupadas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Desistiu por motivos pessoais, não pode mais comparecer..."
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => handleStatusChange("withdrawn")}>
              Confirmar Remoção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
