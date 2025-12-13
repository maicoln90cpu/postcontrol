/**
 * AdminEventsTab - Fase 2 da Refatoração
 * Extrai a tab de Eventos do Admin.tsx
 */

import { memo, Suspense, lazy } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Copy, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const VirtualizedEventList = lazy(() => import("@/components/VirtualizedEventList").then(m => ({
  default: m.VirtualizedEventList
})));

const EventSlotsCounter = lazy(() => import("@/components/EventSlotsCounter").then(m => ({
  default: m.EventSlotsCounter
})));

export interface AdminEventsTabProps {
  events: any[];
  filteredEvents: any[];
  eventActiveFilter: string;
  eventSortOrder: string;
  isReadOnly: boolean;
  isDuplicatingEvent: string | null;
  isDeletingEvent: string | null;
  submissionsByEvent: Record<string, number>;
  agencySlug?: string;
  onEventActiveFilterChange: (value: string) => void;
  onEventSortOrderChange: (value: string) => void;
  onNewEvent: () => void;
  onEditEvent: (event: any) => void;
  onDuplicateEvent: (event: any) => void;
  onDeleteEvent: (eventId: string) => void;
  onCopyEventUrl: (agencySlug: string, eventSlug: string) => void;
}

export const AdminEventsTab = memo(({
  events,
  filteredEvents,
  eventActiveFilter,
  eventSortOrder,
  isReadOnly,
  isDuplicatingEvent,
  isDeletingEvent,
  submissionsByEvent,
  agencySlug,
  onEventActiveFilterChange,
  onEventSortOrderChange,
  onNewEvent,
  onEditEvent,
  onDuplicateEvent,
  onDeleteEvent,
  onCopyEventUrl
}: AdminEventsTabProps) => {
  return (
    <TabsContent value="events" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Eventos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredEvents.length} evento{filteredEvents.length !== 1 ? "s" : ""} encontrado
            {filteredEvents.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={eventActiveFilter} onValueChange={onEventActiveFilterChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eventos</SelectItem>
              <SelectItem value="active">✅ Apenas Ativos</SelectItem>
              <SelectItem value="inactive">❌ Apenas Inativos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={eventSortOrder} onValueChange={onEventSortOrderChange}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Classificar eventos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">📅 Mais Recentes Primeiro</SelectItem>
              <SelectItem value="oldest">📅 Mais Antigos Primeiro</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            id="create-event-button" 
            className="bg-gradient-primary w-full sm:w-auto" 
            onClick={onNewEvent}
            disabled={isReadOnly}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Evento
          </Button>
          {isReadOnly && <span className="text-xs text-red-500">⚠️ Assine para editar</span>}
        </div>
      </div>

      <Card className="p-6">
        {filteredEvents.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {eventActiveFilter === "all" ? "Nenhum evento cadastrado ainda" : "Nenhum evento encontrado com este filtro"}
          </p>
        ) : filteredEvents.length > 15 ? (
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <VirtualizedEventList
              events={filteredEvents}
              submissionsByEvent={submissionsByEvent}
              isReadOnly={isReadOnly}
              isDuplicatingEvent={isDuplicatingEvent}
              isDeletingEvent={isDeletingEvent}
              onEdit={onEditEvent}
              onDuplicate={onDuplicateEvent}
              onDelete={onDeleteEvent}
              onCopyUrl={onCopyEventUrl}
              agencySlug={agencySlug}
            />
          </Suspense>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map(event => (
              <Card 
                key={event.id} 
                className={cn(
                  "p-4 transition-all duration-200",
                  event.is_active 
                    ? "border-l-4 border-l-green-500 bg-card" 
                    : "border-l-4 border-l-muted opacity-70 bg-muted/30"
                )}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{event.title}</h3>
                      <Badge 
                        variant={event.is_active ? "default" : "secondary"} 
                        className={cn(
                          "text-xs px-2 py-0.5",
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
                    {event.location && <p className="text-sm text-muted-foreground">📍 {event.location}</p>}
                    <p className="text-sm text-muted-foreground mt-1">
                      📊 {submissionsByEvent[event.id] || 0} submissões | Requisitos: {event.required_posts} posts, {event.required_sales} vendas
                    </p>
                    {event.event_slug ? (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-md border">
                        <span className="text-xs font-mono text-muted-foreground">🔗 {event.event_slug}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onCopyEventUrl(agencySlug || "", event.event_slug!)} 
                          className="h-6 px-2 text-xs"
                        >
                          Copiar URL Pública
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-amber-500/10 rounded-md border border-amber-500/20">
                        <span className="text-xs text-amber-600 dark:text-amber-400">⚠️ Slug não definido</span>
                      </div>
                    )}
                    {event.description && <p className="text-muted-foreground mt-2">{event.description}</p>}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEditEvent(event)}
                      className="flex-1 sm:flex-initial" 
                      disabled={isReadOnly}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onDuplicateEvent(event)}
                      className="flex-1 sm:flex-initial" 
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
                      onClick={() => onDeleteEvent(event.id)}
                      className="text-destructive hover:text-destructive flex-1 sm:flex-initial" 
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
            ))}
          </div>
        )}
      </Card>

      {/* Controle de Vagas - Grid Completo */}
      {filteredEvents.length > 0 && filteredEvents.filter(e => e.is_active && e.numero_de_vagas).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">📊 Controle de Vagas - Todos os Eventos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEvents.filter(e => e.is_active && e.numero_de_vagas).map(event => (
              <Suspense key={event.id} fallback={<Skeleton className="h-64 w-full" />}>
                <EventSlotsCounter eventId={event.id} eventTitle={event.title} variant="detailed" />
              </Suspense>
            ))}
          </div>
        </div>
      )}
    </TabsContent>
  );
});

AdminEventsTab.displayName = "AdminEventsTab";
