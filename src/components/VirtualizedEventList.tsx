import { memo, CSSProperties, ReactElement } from 'react';
import { List } from 'react-window';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Copy, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  event_date?: string;
  location?: string;
  description?: string;
  event_slug?: string;
  is_active: boolean;
  required_posts?: number;
  required_sales?: number;
}

interface VirtualizedEventListProps {
  events: Event[];
  submissionsByEvent: Record<string, number>;
  isReadOnly: boolean;
  isDuplicatingEvent: string | null;
  isDeletingEvent: string | null;
  onEdit: (event: Event) => void;
  onDuplicate: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onCopyUrl: (agencySlug: string, eventSlug: string) => void;
  agencySlug?: string;
}

interface RowProps {
  events: Event[];
  submissionsByEvent: Record<string, number>;
  isReadOnly: boolean;
  isDuplicatingEvent: string | null;
  isDeletingEvent: string | null;
  onEdit: (event: Event) => void;
  onDuplicate: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onCopyUrl: (agencySlug: string, eventSlug: string) => void;
  agencySlug?: string;
}

const ITEM_HEIGHT = 200; // Altura estimada de cada card

// Row component following react-window v2 API
const Row = (props: {
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  index: number;
  style: CSSProperties;
} & RowProps): ReactElement => {
  const { 
    index, 
    style, 
    events, 
    submissionsByEvent, 
    isReadOnly, 
    isDuplicatingEvent, 
    isDeletingEvent, 
    onEdit, 
    onDuplicate, 
    onDelete, 
    onCopyUrl, 
    agencySlug 
  } = props;
  
  const event = events[index];
  
  return (
    <div style={{ ...style, paddingBottom: 16, paddingRight: 8 }}>
      <Card 
        className={cn(
          "p-4 transition-all duration-200 h-[180px] overflow-hidden",
          event.is_active 
            ? "border-l-4 border-l-green-500 bg-card" 
            : "border-l-4 border-l-muted opacity-70 bg-muted/30"
        )}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 h-full">
          <div className="flex-1 w-full overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg truncate">{event.title}</h3>
              <Badge 
                variant={event.is_active ? "default" : "secondary"} 
                className={cn(
                  "text-xs px-2 py-0.5 flex-shrink-0",
                  event.is_active 
                    ? "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {event.is_active ? "✓ Ativo" : "Inativo"}
              </Badge>
            </div>
            {event.event_date && (
              <p className="text-sm text-muted-foreground mt-1">
                📅 {new Date(event.event_date).toLocaleString("pt-BR")}
              </p>
            )}
            {event.location && (
              <p className="text-sm text-muted-foreground truncate">📍 {event.location}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              📊 {submissionsByEvent[event.id] || 0} submissões | Requisitos: {event.required_posts || 0} posts, {event.required_sales || 0} vendas
            </p>
            {event.event_slug && agencySlug ? (
              <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-md border">
                <span className="text-xs font-mono text-muted-foreground truncate">🔗 {event.event_slug}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onCopyUrl(agencySlug, event.event_slug!)} 
                  className="h-6 px-2 text-xs flex-shrink-0"
                >
                  Copiar URL
                </Button>
              </div>
            ) : !event.event_slug && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-amber-500/10 rounded-md border border-amber-500/20">
                <span className="text-xs text-amber-600 dark:text-amber-400">⚠️ Slug não definido</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(event)} 
              disabled={isReadOnly}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDuplicate(event)} 
              title="Duplicar evento" 
              disabled={isReadOnly || isDuplicatingEvent === event.id}
            >
              {isDuplicatingEvent === event.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelete(event.id)} 
              className="text-destructive hover:text-destructive" 
              disabled={isReadOnly || isDeletingEvent === event.id}
            >
              {isDeletingEvent === event.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const VirtualizedEventListComponent = ({
  events,
  submissionsByEvent,
  isReadOnly,
  isDuplicatingEvent,
  isDeletingEvent,
  onEdit,
  onDuplicate,
  onDelete,
  onCopyUrl,
  agencySlug,
}: VirtualizedEventListProps) => {
  return (
    <List
      style={{ height: 600 }}
      rowCount={events.length}
      rowHeight={ITEM_HEIGHT}
      overscanCount={3}
      rowComponent={Row}
      rowProps={{
        events,
        submissionsByEvent,
        isReadOnly,
        isDuplicatingEvent,
        isDeletingEvent,
        onEdit,
        onDuplicate,
        onDelete,
        onCopyUrl,
        agencySlug,
      }}
    />
  );
};

export const VirtualizedEventList = memo(VirtualizedEventListComponent);
