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
import { UserX, UserCheck, CheckCircle, Award } from "lucide-react";
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
  manual_approval: boolean;
  manual_approval_reason: string | null;
}

interface ParticipantStatusManagerProps {
  eventId: string;
  eventTitle: string;
}

type DialogMode = "withdraw" | "approve" | "revoke" | null;

export const ParticipantStatusManager = ({ eventId, eventTitle }: ParticipantStatusManagerProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [minPosts, setMinPosts] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [reasonText, setReasonText] = useState("");

  const fetchParticipants = async () => {
    setLoading(true);
    
    // Query base fields that always exist
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
        withdrawn_at,
        manual_approval,
        manual_approval_reason
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

    const userIds = goalsData.map(g => g.user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, phone, instagram")
      .in("id", userIds);

    if (profilesError) {
      console.error("Erro ao carregar perfis:", profilesError);
    }

    const profilesMap = new Map(
      (profilesData || []).map(p => [p.id, p])
    );

    const formatted = goalsData.map((g: any) => {
      const profile = profilesMap.get(g.user_id);
      return {
        user_id: g.user_id,
        full_name: profile?.full_name || "Sem nome",
        avatar_url: profile?.avatar_url || null,
        phone: profile?.phone || null,
        current_posts: g.current_posts ?? 0,
        current_sales: g.current_sales ?? 0,
        required_posts: g.required_posts ?? 0,
        required_sales: g.required_sales ?? 0,
        goal_achieved: g.goal_achieved === true,
        participation_status: g.participation_status || "active",
        withdrawn_reason: g.withdrawn_reason || null,
        withdrawn_at: g.withdrawn_at || null,
        manual_approval: g.manual_approval === true,
        manual_approval_reason: g.manual_approval_reason || null,
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

    if (filter === "active") {
      filtered = filtered.filter(p => p.participation_status === "active");
    } else if (filter === "withdrawn") {
      filtered = filtered.filter(p => p.participation_status === "withdrawn");
    } else if (filter === "goal_achieved") {
      filtered = filtered.filter(p => p.goal_achieved === true);
    } else if (filter === "manual_approved") {
      filtered = filtered.filter(p => p.manual_approval === true && p.goal_achieved !== true);
    } else if (filter === "in_progress") {
      filtered = filtered.filter(p => 
        p.goal_achieved !== true && 
        p.manual_approval !== true && 
        p.participation_status === "active"
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por quantidade mínima de posts
    if (minPosts > 0) {
      filtered = filtered.filter(p => p.current_posts >= minPosts);
    }

    setFilteredParticipants(filtered);
  }, [filter, searchTerm, participants, minPosts]);

  const {
    paginatedItems: paginatedParticipants,
    currentPage,
    totalPages,
    goToPage,
    hasNextPage,
    hasPreviousPage,
  } = usePagination({
    items: filteredParticipants,
    itemsPerPage: 30,
  });

  const handleWithdraw = async () => {
    if (!selectedParticipant) return;

    const { error } = await supabase.rpc("update_participation_status", {
      p_user_id: selectedParticipant.user_id,
      p_event_id: eventId,
      p_status: "withdrawn",
      p_reason: reasonText || null,
    });

    if (error) {
      toast.error("Erro ao remover participante");
      console.error(error);
    } else {
      toast.success("Participante removida");
      fetchParticipants();
      closeDialog();
    }
  };

  const handleReactivate = async (participant: Participant) => {
    const { error } = await supabase.rpc("update_participation_status", {
      p_user_id: participant.user_id,
      p_event_id: eventId,
      p_status: "active",
      p_reason: null,
    });

    if (error) {
      toast.error("Erro ao reativar participante");
      console.error(error);
    } else {
      toast.success("Participante reativada");
      fetchParticipants();
    }
  };

  const handleManualApproval = async () => {
    if (!selectedParticipant || !reasonText.trim()) {
      toast.error("Informe o motivo da aprovação");
      return;
    }

    // Using 'as any' because RPC may not be in generated types yet
    const { error } = await (supabase.rpc as any)("approve_participant_manually", {
      p_user_id: selectedParticipant.user_id,
      p_event_id: eventId,
      p_approve: true,
      p_reason: reasonText,
    });

    if (error) {
      toast.error("Erro ao aprovar participante");
      console.error(error);
    } else {
      toast.success("Participante aprovada manualmente!");
      fetchParticipants();
      closeDialog();
    }
  };

  const handleRevokeApproval = async () => {
    if (!selectedParticipant) return;

    // Using 'as any' because RPC may not be in generated types yet
    const { error } = await (supabase.rpc as any)("approve_participant_manually", {
      p_user_id: selectedParticipant.user_id,
      p_event_id: eventId,
      p_approve: false,
      p_reason: null,
    });

    if (error) {
      toast.error("Erro ao revogar aprovação");
      console.error(error);
    } else {
      toast.success("Aprovação revogada");
      fetchParticipants();
      closeDialog();
    }
  };

  const openDialog = (participant: Participant, mode: DialogMode) => {
    setSelectedParticipant(participant);
    setDialogMode(mode);
    setReasonText("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogMode(null);
    setSelectedParticipant(null);
    setReasonText("");
  };

  const getStatusBadges = (participant: Participant) => {
    const badges = [];

    // Badge de aprovação (meta ou manual)
    if (participant.goal_achieved) {
      badges.push(
        <Badge key="goal" className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          Meta Batida
        </Badge>
      );
    } else if (participant.manual_approval) {
      badges.push(
        <Badge key="manual" className="bg-violet-600 hover:bg-violet-700">
          <Award className="h-3 w-3 mr-1" />
          Aprovada Agência
        </Badge>
      );
    }

    // Badge de participação
    if (participant.participation_status === "withdrawn") {
      badges.push(
        <Badge key="status" variant="destructive">Removida</Badge>
      );
    } else {
      badges.push(
        <Badge key="status" variant="secondary">Participando</Badge>
      );
    }

    return badges;
  };

  const canApproveManually = (p: Participant) => 
    !p.goal_achieved && !p.manual_approval && p.participation_status === "active";

  const canRevokeApproval = (p: Participant) =>
    p.manual_approval && !p.goal_achieved && p.participation_status === "active";

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
          <div className="w-full sm:w-52">
            <Label htmlFor="filter">Filtrar por</Label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger id="filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Participando</SelectItem>
                <SelectItem value="goal_achieved">Bateram Meta</SelectItem>
                <SelectItem value="manual_approved">Aprovadas Agência</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="withdrawn">Removidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-32">
            <Label htmlFor="minPosts">Mín. Posts</Label>
            <Input
              id="minPosts"
              type="number"
              min={0}
              placeholder="0"
              value={minPosts || ""}
              onChange={(e) => setMinPosts(parseInt(e.target.value) || 0)}
            />
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
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4 ${
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
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{participant.full_name}</p>
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
                        {participant.manual_approval_reason && (
                          <p className="text-xs text-violet-600 dark:text-violet-400 italic">
                            💬 {participant.manual_approval_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {getStatusBadges(participant)}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Botão Aprovar Vaga (para quem não bateu meta e não foi aprovada) */}
                    {canApproveManually(participant) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-violet-600 border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950"
                        onClick={() => openDialog(participant, "approve")}
                      >
                        <Award className="h-4 w-4 mr-2" />
                        Aprovar Vaga
                      </Button>
                    )}

                    {/* Botão Revogar Aprovação (para aprovadas manualmente) */}
                    {canRevokeApproval(participant) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-orange-600 border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                        onClick={() => openDialog(participant, "revoke")}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Revogar
                      </Button>
                    )}

                    {/* Botão Remover/Reativar */}
                    {participant.participation_status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(participant, "withdraw")}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReactivate(participant)}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Reativar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

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

      {/* Dialog Multiuso */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "withdraw" && "Remover Participante"}
              {dialogMode === "approve" && "Aprovar Vaga Manualmente"}
              {dialogMode === "revoke" && "Revogar Aprovação Manual"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "withdraw" && (
                <>
                  Você está removendo <strong>{selectedParticipant?.full_name}</strong> do evento.
                  Esta participante não será mais contabilizada nas vagas ocupadas.
                </>
              )}
              {dialogMode === "approve" && (
                <>
                  Você está aprovando <strong>{selectedParticipant?.full_name}</strong> manualmente.
                  Esta participante ocupará uma vaga mesmo sem ter batido a meta técnica.
                </>
              )}
              {dialogMode === "revoke" && (
                <>
                  Você está revogando a aprovação manual de <strong>{selectedParticipant?.full_name}</strong>.
                  A vaga será liberada.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {(dialogMode === "withdraw" || dialogMode === "approve") && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="reason">
                  {dialogMode === "approve" ? "Motivo da aprovação *" : "Motivo (opcional)"}
                </Label>
                <Textarea
                  id="reason"
                  placeholder={
                    dialogMode === "approve"
                      ? "Ex: Destaque em eventos anteriores, mérito especial..."
                      : "Ex: Desistiu por motivos pessoais..."
                  }
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            {dialogMode === "withdraw" && (
              <Button variant="destructive" onClick={handleWithdraw}>
                Confirmar Remoção
              </Button>
            )}
            {dialogMode === "approve" && (
              <Button 
                className="bg-violet-600 hover:bg-violet-700"
                onClick={handleManualApproval}
                disabled={!reasonText.trim()}
              >
                <Award className="h-4 w-4 mr-2" />
                Confirmar Aprovação
              </Button>
            )}
            {dialogMode === "revoke" && (
              <Button variant="destructive" onClick={handleRevokeApproval}>
                Revogar Aprovação
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};