import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Clock, Calendar } from "lucide-react";
import { sb } from "@/lib/supabaseSafe";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgencyRequest {
  id: string;
  user_id: string;
  agency_name: string;
  agency_slug: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  profiles?: {
    email: string;
    full_name: string | null;
  };
}

export function AgencyRequestsManager() {
  const [requests, setRequests] = useState<AgencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AgencyRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await sb
        .from('agency_requests')
        .select(`
          *,
          profiles!agency_requests_user_id_fkey (
            email,
            full_name
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error loading requests:', error);
        toast.error("Erro ao carregar solicitações");
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Erro ao carregar solicitações");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: AgencyRequest) => {
    setProcessing(true);
    try {
      console.log('📝 Aprovando solicitação:', request.id);

      const { error } = await sb.functions.invoke('approve-agency-request', {
        body: {
          requestId: request.id,
          action: 'approve',
        },
      });

      if (error) {
        console.error('Error approving request:', error);
        toast.error("Erro ao aprovar solicitação: " + error.message);
        return;
      }

      toast.success(`Agência "${request.agency_name}" aprovada!`);
      loadRequests();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("Erro ao aprovar solicitação: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    if (!rejectionReason.trim()) {
      toast.error("Por favor, informe o motivo da rejeição");
      return;
    }

    setProcessing(true);
    try {
      console.log('❌ Rejeitando solicitação:', selectedRequest.id);

      const { error } = await sb.functions.invoke('approve-agency-request', {
        body: {
          requestId: selectedRequest.id,
          action: 'reject',
          rejectionReason,
        },
      });

      if (error) {
        console.error('Error rejecting request:', error);
        toast.error("Erro ao rejeitar solicitação: " + error.message);
        return;
      }

      toast.success(`Solicitação de "${selectedRequest.agency_name}" rejeitada`);
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("Erro ao rejeitar solicitação: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "Pendente" },
      approved: { variant: "default", icon: CheckCircle2, label: "Aprovado" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejeitado" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Solicitações de Agências
          </CardTitle>
          <CardDescription>
            Gerencie solicitações de criação de novas agências
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <div className="text-sm text-muted-foreground">Aprovadas</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
              <div className="text-sm text-muted-foreground">Rejeitadas</div>
            </Card>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma solicitação encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Agência</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Solicitado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {request.profiles?.full_name || request.profiles?.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {request.profiles?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{request.agency_name}</TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {request.agency_slug}
                      </code>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {format(new Date(request.requested_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(request)}
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedRequest(request);
                              setRejectDialogOpen(true);
                            }}
                            disabled={processing}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                      {request.status === 'rejected' && request.rejection_reason && (
                        <div className="text-sm text-muted-foreground max-w-xs">
                          <strong>Motivo:</strong> {request.rejection_reason}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição da solicitação de <strong>{selectedRequest?.agency_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Motivo da Rejeição</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Ex: Slug já está em uso, informações incompletas, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
                setSelectedRequest(null);
              }}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing}
            >
              {processing ? "Rejeitando..." : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
