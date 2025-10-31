import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsGuest } from '@/hooks/useIsGuest';
import { useGuestPermissions } from '@/hooks/useGuestPermissions';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, Trophy, Eye, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { PERMISSION_LABELS } from '@/types/guest';

export const GuestDashboard = () => {
  const navigate = useNavigate();
  const { isGuest, guestData, loading: guestLoading } = useIsGuest();
  const { hasPermission, getPermissionLevel, allowedEvents, loading: permissionsLoading } = useGuestPermissions();
  const [events, setEvents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    if (!guestLoading && !isGuest) {
      toast.error('Você não tem acesso de convidado');
      navigate('/dashboard');
    }
  }, [isGuest, guestLoading, navigate]);

  useEffect(() => {
    if (isGuest && allowedEvents.length > 0) {
      loadEvents();
    }
  }, [isGuest, allowedEvents]);

  useEffect(() => {
    if (selectedEventId) {
      loadSubmissions();
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('id', allowedEvents)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);

      // Auto-selecionar primeiro evento
      if (data && data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].id);
      }
    } catch (err: any) {
      console.error('Error loading events:', err);
      toast.error('Erro ao carregar eventos');
    }
  };

  const loadSubmissions = async () => {
    if (!selectedEventId) return;

    setLoadingSubmissions(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          posts(
            post_number,
            deadline,
            event_id,
            events(title)
          ),
          profiles(full_name, email, instagram)
        `)
        .eq('posts.event_id', selectedEventId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Gerar signed URLs para screenshots
      const submissionsWithUrls = await Promise.all((data || []).map(async (s: any) => {
        let signedUrl = s.screenshot_url;
        if (s.screenshot_url) {
          const path = s.screenshot_url.split('/screenshots/')[1];
          if (path) {
            const { data: urlData } = await supabase.storage
              .from('screenshots')
              .createSignedUrl(path, 31536000);
            if (urlData?.signedUrl) {
              signedUrl = urlData.signedUrl;
            }
          }
        }
        return { ...s, screenshot_url: signedUrl };
      }));

      setSubmissions(submissionsWithUrls);
    } catch (err: any) {
      console.error('Error loading submissions:', err);
      toast.error('Erro ao carregar submissões');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleApproveSubmission = async (submissionId: string) => {
    if (!selectedEventId || !hasPermission(selectedEventId, 'moderator')) {
      toast.error('Você não tem permissão para aprovar submissões');
      return;
    }

    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success('Submissão aprovada!');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Log da ação
      await supabase.from('guest_audit_log').insert({
        guest_id: guestData.id,
        event_id: selectedEventId,
        submission_id: submissionId,
        action: 'approved_submission',
        action_data: { status: 'approved' }
      });

      loadSubmissions();
    } catch (err: any) {
      console.error('Error approving submission:', err);
      toast.error('Erro ao aprovar submissão');
    }
  };

  const handleRejectSubmission = async (submissionId: string, reason: string) => {
    if (!selectedEventId || !hasPermission(selectedEventId, 'moderator')) {
      toast.error('Você não tem permissão para reprovar submissões');
      return;
    }

    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success('Submissão reprovada');

      // Log da ação
      await supabase.from('guest_audit_log').insert({
        guest_id: guestData.id,
        event_id: selectedEventId,
        submission_id: submissionId,
        action: 'rejected_submission',
        action_data: { status: 'rejected', reason }
      });

      loadSubmissions();
    } catch (err: any) {
      console.error('Error rejecting submission:', err);
      toast.error('Erro ao reprovar submissão');
    }
  };

  if (guestLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isGuest) {
    return null;
  }

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const permissionLevel = selectedEventId ? getPermissionLevel(selectedEventId) : null;

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard de Convidado</h1>
              <p className="text-muted-foreground">
                Acesso válido até {new Date(guestData.access_end_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Eye className="mr-2 h-4 w-4" />
              Convidado
            </Badge>
          </div>
        </div>

        {/* Seletor de Eventos */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Eventos com Acesso</h3>
          <div className="flex gap-2 flex-wrap">
            {events.map((event) => {
              const level = getPermissionLevel(event.id);
              return (
                <Button
                  key={event.id}
                  onClick={() => setSelectedEventId(event.id)}
                  variant={selectedEventId === event.id ? 'default' : 'outline'}
                  className="flex items-center gap-2"
                >
                  {event.title}
                  {level && (
                    <Badge variant="secondary" className="ml-2">
                      {PERMISSION_LABELS[level]}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </Card>

        {selectedEvent && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aprovadas</p>
                    <p className="text-2xl font-bold">{stats.approved}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-500/10 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reprovadas</p>
                    <p className="text-2xl font-bold">{stats.rejected}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Permissões Info */}
            {permissionLevel && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Nível de Acesso: {PERMISSION_LABELS[permissionLevel]}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {permissionLevel === 'viewer' && 'Você pode visualizar estatísticas e submissões'}
                      {permissionLevel === 'moderator' && 'Você pode visualizar, aprovar e reprovar submissões'}
                      {permissionLevel === 'manager' && 'Você tem acesso total: gerenciar posts, editar evento e aprovar submissões'}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Submissões */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Submissões - {selectedEvent.title}</h3>
              
              {loadingSubmissions ? (
                <p className="text-center text-muted-foreground py-8">Carregando submissões...</p>
              ) : submissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma submissão encontrada</p>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <Card key={submission.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{submission.profiles?.full_name}</span>
                            <Badge variant={
                              submission.status === 'approved' ? 'default' :
                              submission.status === 'rejected' ? 'destructive' :
                              'secondary'
                            }>
                              {submission.status === 'approved' ? 'Aprovada' :
                               submission.status === 'rejected' ? 'Reprovada' :
                               'Pendente'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {submission.profiles?.instagram && `@${submission.profiles.instagram}`}
                          </p>
                          {submission.screenshot_url && (
                            <img 
                              src={submission.screenshot_url}
                              alt="Screenshot"
                              className="w-full max-w-xs rounded-lg border"
                            />
                          )}
                        </div>

                        {permissionLevel && hasPermission(selectedEventId!, 'moderator') && submission.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveSubmission(submission.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const reason = prompt('Motivo da reprovação:');
                                if (reason) handleRejectSubmission(submission.id, reason);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reprovar
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
