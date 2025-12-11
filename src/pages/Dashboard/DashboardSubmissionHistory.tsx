import { memo, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2 } from 'lucide-react';
import { Event, SubmissionWithImage } from '@/types/dashboard';

/**
 * Dashboard Submission History Component
 * 
 * Displays user's submission history with filtering by event.
 * Memoized to prevent unnecessary re-renders.
 * 
 * @component
 */

/**
 * Submission data structure for history display
 * @deprecated Use SubmissionWithImage from @/types/dashboard instead
 */
interface Submission {
  id: string;
  status: string;
  submitted_at: string;
  rejection_reason?: string;
  screenshot_url?: string;
  screenshot_path?: string;
  posts?: {
    post_number: number;
    events?: {
      title: string;
    };
  };
}

/**
 * Event data structure (deprecated, use Event from types/dashboard)
 * @deprecated
 */
interface EventData {
  id: string;
  title: string;
}

/**
 * Props for DashboardSubmissionHistory component
 */
interface DashboardSubmissionHistoryProps {
  /** Array of user submissions to display */
  submissions: SubmissionWithImage[];
  /** Available events for filter dropdown */
  events: Event[];
  /** Currently selected event filter value */
  selectedEvent: string;
  /** Callback when event filter changes */
  onEventChange: (value: string) => void;
  /** Callback when submission delete is requested */
  onDeleteSubmission: (submission: {
    id: string;
    status: string;
  }) => void;
  /** Optional lazy-loaded image display component */
  SubmissionImageDisplay?: React.ComponentType<any>;
}
const DashboardSubmissionHistoryComponent = ({
  submissions,
  events,
  selectedEvent,
  onEventChange,
  onDeleteSubmission,
  SubmissionImageDisplay
}: DashboardSubmissionHistoryProps) => {
  return <Card className="p-6">
      <div className="mb-6 flex-col flex items-center justify-between">
        <h2 className="text-2xl font-bold text-center">Histórico de Submissões</h2>
        <Select value={selectedEvent} onValueChange={onEventChange}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filtrar por evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os eventos</SelectItem>
            {events.map(event => <SelectItem key={event.id} value={event.id}>
                {event.title}
              </SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {submissions.length > 0 ? submissions.map(submission => <Card key={submission.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant={submission.status === 'approved' ? 'default' : submission.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {submission.status === 'approved' ? 'Aprovado' : submission.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(submission.submitted_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="font-medium">
                    {submission.posts?.events?.title} - Post #{submission.posts?.post_number}
                  </p>
                  {submission.rejection_reason && <p className="text-sm text-destructive">Motivo: {submission.rejection_reason}</p>}
                </div>
                {submission.screenshot_url && SubmissionImageDisplay && <div className="w-20 h-20 aspect-square bg-muted rounded overflow-hidden flex-shrink-0">
                    <Suspense fallback={<Skeleton className="w-full h-full" />}>
                      <SubmissionImageDisplay screenshotPath={submission.screenshot_path} screenshotUrl={submission.screenshot_url} className="w-full h-full object-cover" />
                    </Suspense>
                  </div>}
              </div>
              {/* Botão excluir para submissões pendentes ou reprovadas */}
              {(submission.status === 'pending' || submission.status === 'rejected') && (
                <div className="mt-3 pt-3 border-t">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto" 
                    onClick={() => onDeleteSubmission({
                      id: submission.id,
                      status: submission.status
                    })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {submission.status === 'rejected' ? 'Excluir e Reenviar' : 'Excluir Submissão'}
                  </Button>
                  {submission.status === 'rejected' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Você pode enviar uma nova submissão após excluir
                    </p>
                  )}
                </div>
              )}
            </Card>) : <p className="text-center text-muted-foreground py-8">Nenhuma submissão encontrada</p>}
      </div>
    </Card>;
};
export const DashboardSubmissionHistory = memo(DashboardSubmissionHistoryComponent);