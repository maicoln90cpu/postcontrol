import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, User, Activity, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GuestAuditLogProps {
  agencyId: string;
}

export const GuestAuditLog = ({ agencyId }: GuestAuditLogProps) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadLogs();
  }, [agencyId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('guest_audit_log')
        .select(`
          *,
          guest:agency_guests(
            guest_email,
            agencies(name)
          ),
          event:events(title),
          submission:submissions(
            user_id,
            profiles!submissions_user_id_fkey(full_name, email)
          )
        `)
        .eq('guest.agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'approved_submission': 'Aprovou Submissão',
      'rejected_submission': 'Reprovou Submissão',
      'viewed_event': 'Visualizou Evento',
      'added_comment': 'Adicionou Comentário',
      'edited_post': 'Editou Post',
      'created_post': 'Criou Post',
      'deleted_post': 'Deletou Post',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('approved')) return 'default';
    if (action.includes('rejected')) return 'destructive';
    if (action.includes('deleted')) return 'destructive';
    if (action.includes('created')) return 'default';
    return 'secondary';
  };

  const filteredLogs = logs.filter(log => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (dateFilter && !log.created_at.startsWith(dateFilter)) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const email = log.guest?.guest_email?.toLowerCase() || '';
      const event = log.event?.title?.toLowerCase() || '';
      if (!email.includes(search) && !event.includes(search)) return false;
    }
    return true;
  });

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Carregando logs...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Log de Auditoria</h2>
          <p className="text-muted-foreground">
            Histórico de ações de convidados
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {filteredLogs.length} registros
        </Badge>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Buscar
            </label>
            <Input
              placeholder="Email ou evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Ação
            </label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as ações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {getActionLabel(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data
            </label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Lista de Logs */}
      {filteredLogs.length === 0 ? (
        <Card className="p-8">
          <p className="text-center text-muted-foreground">
            Nenhum registro encontrado
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <Card key={log.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getActionColor(log.action)}>
                      {getActionLabel(log.action)}
                    </Badge>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{log.guest?.guest_email}</span>
                    </div>

                    {log.event && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{log.event.title}</span>
                      </div>
                    )}
                  </div>

                  {log.submission && (
                    <p className="text-sm text-muted-foreground">
                      Submissão de: {log.submission.profiles?.full_name || log.submission.profiles?.email}
                    </p>
                  )}

                  {log.action_data && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Ver detalhes
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(log.action_data, null, 2)}
                      </pre>
                    </details>
                  )}

                  {log.ip_address && (
                    <p className="text-xs text-muted-foreground">
                      IP: {log.ip_address}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium">
                    {format(new Date(log.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
