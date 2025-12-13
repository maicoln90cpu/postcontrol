/**
 * AdminStatsTab - Fase 2 da Refatoração
 * Extrai a tab de Estatísticas do Admin.tsx
 */

import { memo, Suspense, lazy } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare } from "lucide-react";

const MemoizedDashboardStats = lazy(() => import("@/components/memoized/MemoizedDashboardStats").then(m => ({
  default: m.MemoizedDashboardStats
})));

const MemoizedUserPerformance = lazy(() => import("@/components/memoized/MemoizedUserPerformance").then(m => ({
  default: m.MemoizedUserPerformance
})));

const TopPromotersRanking = lazy(() => import("@/components/TopPromotersRanking").then(m => ({
  default: m.TopPromotersRanking
})));

const DetailedGoalsReport = lazy(() => import("@/components/DetailedGoalsReport").then(m => ({
  default: m.DetailedGoalsReport
})));

const GoalAchievedReport = lazy(() => import("@/components/GoalAchievedReport").then(m => ({
  default: m.GoalAchievedReport
})));

const ParticipantStatusManager = lazy(() => import("@/components/ParticipantStatusManager").then(m => ({
  default: m.ParticipantStatusManager
})));

const SlotExhaustionPrediction = lazy(() => import("@/components/SlotExhaustionPrediction").then(m => ({
  default: m.SlotExhaustionPrediction
})));

const ReferralAnalytics = lazy(() => import("@/components/ReferralAnalytics").then(m => ({
  default: m.ReferralAnalytics
})));

const UTMLinkGenerator = lazy(() => import("@/components/UTMLinkGenerator").then(m => ({
  default: m.UTMLinkGenerator
})));

export interface AdminStatsTabProps {
  events: any[];
  filteredEvents: any[];
  globalStatsEventFilter: 'active' | 'inactive' | 'all';
  globalSelectedEventId: string;
  agencyId?: string;
  profileAgencyId?: string;
  onFilterChange: (filter: 'active' | 'inactive' | 'all') => void;
  onEventChange: (eventId: string) => void;
}

export const AdminStatsTab = memo(({
  events,
  filteredEvents,
  globalStatsEventFilter,
  globalSelectedEventId,
  agencyId,
  profileAgencyId,
  onFilterChange,
  onEventChange
}: AdminStatsTabProps) => {
  const selectedEvent = filteredEvents.find(e => e.id === globalSelectedEventId);

  return (
    <TabsContent value="statistics" className="space-y-6">
      {/* Card de Filtros Global */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros Globais</CardTitle>
          <CardDescription>Selecione o status e evento para todas as estatísticas abaixo</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <Select 
            value={globalStatsEventFilter} 
            onValueChange={(value: 'active' | 'inactive' | 'all') => {
              onFilterChange(value);
              onEventChange('all');
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status do evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Eventos Ativos</SelectItem>
              <SelectItem value="inactive">Eventos Inativos</SelectItem>
              <SelectItem value="all">Todos os Eventos</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={globalSelectedEventId} onValueChange={onEventChange}>
            <SelectTrigger className="w-80">
              <SelectValue placeholder="Selecione um evento (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Eventos</SelectItem>
              {filteredEvents.filter(e => {
                if (globalStatsEventFilter === 'active') return e.is_active;
                if (globalStatsEventFilter === 'inactive') return !e.is_active;
                return true;
              }).map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title} {!event.is_active && '(Inativo)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="events-stats" className="space-y-6">
        <TabsList className="grid w-full max-w-4xl grid-cols-1 sm:grid-cols-5 gap-1 h-auto">
          <TabsTrigger value="events-stats" className="text-xs sm:text-sm whitespace-normal py-2">
            Estatísticas por Evento
          </TabsTrigger>
          <TabsTrigger value="user-performance" className="text-xs sm:text-sm whitespace-normal py-2">
            Desempenho por Usuário
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm whitespace-normal py-2">
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm whitespace-normal py-2">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="utm-generator" className="text-xs sm:text-sm whitespace-normal py-2">
            Gerador UTM
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events-stats" className="space-y-4">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <MemoizedDashboardStats eventId={globalSelectedEventId === 'all' ? undefined : globalSelectedEventId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="user-performance" className="space-y-4">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <MemoizedUserPerformance eventId={globalSelectedEventId === 'all' ? undefined : globalSelectedEventId} />
          </Suspense>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {globalSelectedEventId !== 'all' && (
            <div className="space-y-6">
              {/* Slot Exhaustion Prediction */}
              {selectedEvent?.numero_de_vagas && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      🤖 Previsão Detalhada de Esgotamento (IA)
                    </CardTitle>
                    <CardDescription>
                      Análise inteligente sobre quando as vagas do evento devem se esgotar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                      <SlotExhaustionPrediction 
                        eventId={globalSelectedEventId} 
                        eventTitle={selectedEvent?.title || ""} 
                      />
                    </Suspense>
                  </CardContent>
                </Card>
              )}

              {/* Top Promoters Ranking */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🏆 Ranking de Divulgadoras
                  </CardTitle>
                  <CardDescription>
                    Top 10 divulgadoras com melhor desempenho neste evento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                    <TopPromotersRanking eventId={globalSelectedEventId} limit={10} />
                  </Suspense>
                </CardContent>
              </Card>

              {/* Relatório Detalhado de Metas por Tipo */}
              {profileAgencyId && (
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                  <DetailedGoalsReport agencyId={profileAgencyId} eventId={globalSelectedEventId} />
                </Suspense>
              )}

              {/* Divulgadoras que bateram meta */}
              {profileAgencyId && (
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                  <GoalAchievedReport agencyId={profileAgencyId} eventId={globalSelectedEventId} />
                </Suspense>
              )}

              {/* Gerenciador de Status de Participantes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    👥 Gerenciar Participantes
                  </CardTitle>
                  <CardDescription>
                    Marcar divulgadoras como removidas/ativas do evento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                    <ParticipantStatusManager 
                      eventId={globalSelectedEventId} 
                      eventTitle={selectedEvent?.title || ""} 
                    />
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Nova aba Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          {agencyId && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                📊 Analytics de Indicações
              </h3>

              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <ReferralAnalytics 
                  agencyId={agencyId} 
                  eventId={globalSelectedEventId === 'all' ? undefined : globalSelectedEventId} 
                />
              </Suspense>
            </div>
          )}
        </TabsContent>

        {/* Nova aba Gerador UTM */}
        <TabsContent value="utm-generator" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <UTMLinkGenerator />
          </Suspense>
        </TabsContent>
      </Tabs>
    </TabsContent>
  );
});

AdminStatsTab.displayName = "AdminStatsTab";
