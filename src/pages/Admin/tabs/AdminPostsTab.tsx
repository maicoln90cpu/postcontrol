/**
 * AdminPostsTab - Fase 2 da Refatoração
 * Extrai a tab de Postagens do Admin.tsx
 */

import { memo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPostName } from "@/lib/postNameFormatter";

export interface AdminPostsTabProps {
  posts: any[];
  events: any[];
  filteredPosts: any[];
  collapsedEvents: Set<string>;
  submissionsByPost: Record<string, number>;
  isReadOnly: boolean;
  loadingEvents: boolean;
  postEventFilter: string;
  postEventActiveFilter: string;
  onToggleCollapse: (eventId: string) => void;
  onNewPost: () => void;
  onEditPost: (post: any) => void;
  onDeletePost: (postId: string, submissionsCount: number) => void;
  onPostEventFilterChange: (value: string) => void;
  onPostEventActiveFilterChange: (value: string) => void;
  getEventMetrics: (eventId: string) => {
    postsByType: { comprovante: number; divulgacao: number; selecao: number };
    totalSubmissions: number;
    totalPosts: number;
  };
}

export const AdminPostsTab = memo(({
  posts,
  events,
  filteredPosts,
  collapsedEvents,
  submissionsByPost,
  isReadOnly,
  loadingEvents,
  postEventFilter,
  postEventActiveFilter,
  onToggleCollapse,
  onNewPost,
  onEditPost,
  onDeletePost,
  onPostEventFilterChange,
  onPostEventActiveFilterChange,
  getEventMetrics
}: AdminPostsTabProps) => {
  // Agrupar posts por evento
  const postsByEventId = useCallback(() => {
    const grouped: Record<string, any[]> = {};
    filteredPosts.forEach(post => {
      if (!grouped[post.event_id]) {
        grouped[post.event_id] = [];
      }
      grouped[post.event_id].push(post);
    });
    return grouped;
  }, [filteredPosts]);

  const groupedPosts = postsByEventId();

  return (
    <TabsContent value="posts" className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Postagens</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredPosts.length} postage{filteredPosts.length !== 1 ? "ns" : "m"} encontrada
              {filteredPosts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={postEventActiveFilter} onValueChange={onPostEventActiveFilterChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Status do evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">✅ Eventos Ativos</SelectItem>
                <SelectItem value="inactive">⏸️ Eventos Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={postEventFilter} onValueChange={onPostEventFilterChange}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Filtrar por evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os eventos</SelectItem>
                {events.filter(event => {
                  if (postEventActiveFilter === "all") return true;
                  if (postEventActiveFilter === "active") return event.is_active === true;
                  if (postEventActiveFilter === "inactive") return event.is_active === false;
                  return true;
                }).map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    <span className="flex items-center gap-2">
                      <span className={event.is_active ? "text-green-600" : "text-gray-400"}>●</span>
                      {event.title}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              className="bg-gradient-primary w-full sm:w-auto" 
              onClick={onNewPost}
              disabled={isReadOnly}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Postagem
            </Button>
            {isReadOnly && <span className="text-xs text-red-500">⚠️ Assine para editar</span>}
          </div>
        </div>
      </div>

      <Card className="p-1">
        {loadingEvents ? (
          <div className="space-y-4 p-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma postagem cadastrada
          </p>
        ) : (
          <div className="space-y-2 p-2">
            {Object.entries(groupedPosts).map(([eventId, eventPosts]) => {
              const event = events.find(e => e.id === eventId);
              const metrics = getEventMetrics(eventId);
              const isCollapsed = collapsedEvents.has(eventId);

              return (
                <Collapsible key={eventId} open={!isCollapsed}>
                  <CollapsibleTrigger 
                    className="w-full"
                    onClick={() => onToggleCollapse(eventId)}
                  >
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-lg transition-colors",
                      "bg-muted/50 hover:bg-muted cursor-pointer"
                    )}>
                      <div className="flex items-center gap-3">
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform",
                          !isCollapsed && "rotate-90"
                        )} />
                        <span className="font-semibold">{event?.title || "Evento Desconhecido"}</span>
                        <Badge variant={event?.is_active ? "default" : "secondary"} className="text-xs">
                          {event?.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {metrics.postsByType.divulgacao > 0 && (
                          <Badge variant="outline" className="text-xs">📢 {metrics.postsByType.divulgacao}</Badge>
                        )}
                        {metrics.postsByType.comprovante > 0 && (
                          <Badge variant="outline" className="text-xs">💰 {metrics.postsByType.comprovante}</Badge>
                        )}
                        {metrics.postsByType.selecao > 0 && (
                          <Badge variant="outline" className="text-xs">👤 {metrics.postsByType.selecao}</Badge>
                        )}
                        <Badge className="text-xs">{metrics.totalSubmissions} submissões</Badge>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 pl-7 pt-2">
                      {eventPosts.map(post => (
                        <Card key={post.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">
                                {formatPostName(post.post_type, post.post_number)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {submissionsByPost[post.id] || 0} submissões
                              </Badge>
                              {post.deadline && (
                                <span className="text-xs text-muted-foreground">
                                  ⏰ {new Date(post.deadline).toLocaleString("pt-BR")}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => onEditPost(post)}
                                disabled={isReadOnly}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => onDeletePost(post.id, submissionsByPost[post.id] || 0)}
                                className="text-destructive hover:text-destructive"
                                disabled={isReadOnly}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </Card>
    </TabsContent>
  );
});

AdminPostsTab.displayName = "AdminPostsTab";
