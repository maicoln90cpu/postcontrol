import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, CheckCircle2, Award, ChevronLeft, ChevronRight } from 'lucide-react';

interface PromoterStats {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  divulgacaoCount: number;
  selecaoPerfilCount: number;
  salesCount: number;
  totalPosts: number;
  goalAchieved: boolean;
  manualApproval: boolean;
  manualApprovalReason: string | null;
  requiredPosts: number;
  requiredSales: number;
}

interface DetailedGoalsReportProps {
  agencyId: string;
  eventId: string;
}

export const DetailedGoalsReport = ({ agencyId, eventId }: DetailedGoalsReportProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['detailed-goals-report', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data: submissions, error: subError } = await supabase
        .from('submissions')
        .select('user_id, submission_type, status')
        .eq('event_id', eventId)
        .eq('status', 'approved');

      if (subError) throw subError;
      if (!submissions || submissions.length === 0) return [];

      const uniqueUserIds = [...new Set(submissions.map(s => s.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', uniqueUserIds);

      if (profilesError) throw profilesError;

      // Using 'as any' because new columns may not be in generated types yet
      const { data: goals, error: goalsError } = await (supabase
        .from('user_event_goals')
        .select('user_id, goal_achieved, required_posts, required_sales, manual_approval, manual_approval_reason') as any)
        .eq('event_id', eventId);

      if (goalsError) throw goalsError;

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const goalsMap = new Map((goals as any[])?.map((g: any) => [g.user_id, g]) || []);

      const userMap = new Map<string, PromoterStats>();

      submissions.forEach((sub) => {
        const userId = sub.user_id;
        const profile = profileMap.get(userId);
        const goal = goalsMap.get(userId);
        
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            fullName: profile?.full_name || 'Sem nome',
            avatarUrl: profile?.avatar_url || null,
            divulgacaoCount: 0,
            selecaoPerfilCount: 0,
            salesCount: 0,
            totalPosts: 0,
            goalAchieved: goal?.goal_achieved || false,
            manualApproval: goal?.manual_approval || false,
            manualApprovalReason: goal?.manual_approval_reason || null,
            requiredPosts: goal?.required_posts || 0,
            requiredSales: goal?.required_sales || 0,
          });
        }

        const stats = userMap.get(userId)!;

        if (sub.submission_type === 'divulgacao') {
          stats.divulgacaoCount++;
        } else if (sub.submission_type === 'selecao_perfil') {
          stats.selecaoPerfilCount++;
        } else if (sub.submission_type === 'sale') {
          stats.salesCount++;
        }
      });

      // Update totalPosts
      userMap.forEach((stats) => {
        stats.totalPosts = stats.divulgacaoCount;
      });

      return Array.from(userMap.values()).sort((a, b) => {
        // Sort: goal_achieved first, then manual_approval, then by posts
        if (a.goalAchieved !== b.goalAchieved) {
          return a.goalAchieved ? -1 : 1;
        }
        if (a.manualApproval !== b.manualApproval) {
          return a.manualApproval ? -1 : 1;
        }
        return b.totalPosts - a.totalPosts;
      });
    },
  });

  const totalPages = Math.ceil((stats?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStats = stats?.slice(startIndex, startIndex + itemsPerPage);

  const getApprovalBadge = (promoter: PromoterStats) => {
    if (promoter.goalAchieved) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-[10px] sm:text-xs px-1.5 py-0.5">
          <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
          Meta
        </Badge>
      );
    }
    if (promoter.manualApproval) {
      return (
        <Badge className="bg-violet-500 hover:bg-violet-600 text-[10px] sm:text-xs px-1.5 py-0.5">
          <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
          Aprovada
        </Badge>
      );
    }
    if (promoter.requiredPosts > 0 && promoter.totalPosts < promoter.requiredPosts) {
      return (
        <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5">
          <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
          -{promoter.requiredPosts - promoter.totalPosts}P
        </Badge>
      );
    }
    if (promoter.requiredSales > 0 && promoter.salesCount < promoter.requiredSales) {
      return (
        <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5">
          <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
          -{promoter.requiredSales - promoter.salesCount}V
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5">
        Progresso
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Relatório Detalhado de Metas
        </CardTitle>
        <CardDescription>
          Visualize quantos posts de cada tipo cada promotor possui
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {statsLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : stats && stats.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Total: <span className="font-bold text-foreground">{stats.length}</span> promotor(es)
              </p>
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
            </div>

            <div className="rounded-md border overflow-x-auto -mx-4 sm:mx-0">
              <Table className="min-w-[750px] text-xs sm:text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[140px] sm:min-w-[180px]">Promotor</TableHead>
                    <TableHead className="text-center px-2 sm:px-4">Divulg.</TableHead>
                    <TableHead className="text-center px-2 sm:px-4">Seleção</TableHead>
                    <TableHead className="text-center px-2 sm:px-4">Vendas</TableHead>
                    <TableHead className="text-center px-2 sm:px-4">Total</TableHead>
                    <TableHead className="text-center px-2 sm:px-4">Meta</TableHead>
                    <TableHead className="text-center px-2 sm:px-4">Tipo</TableHead>
                    <TableHead className="text-center px-2 sm:px-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStats?.map((promoter) => (
                    <TableRow key={promoter.userId}>
                      <TableCell className="sticky left-0 bg-background z-10 px-2 sm:px-4">
                        <div className="flex items-center gap-2 min-w-[140px] sm:min-w-[180px]">
                          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 shrink-0">
                            <AvatarImage src={promoter.avatarUrl || undefined} />
                            <AvatarFallback className="text-[10px] sm:text-xs">
                              {promoter.fullName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium truncate text-xs sm:text-sm">{promoter.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-2 sm:px-4">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[10px] sm:text-xs px-1.5 py-0.5">
                          {promoter.divulgacaoCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center px-2 sm:px-4">
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[10px] sm:text-xs px-1.5 py-0.5">
                          {promoter.selecaoPerfilCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center px-2 sm:px-4">
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-300 text-[10px] sm:text-xs px-1.5 py-0.5">
                          {promoter.salesCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center px-2 sm:px-4">
                        <div className="font-semibold text-xs sm:text-sm">
                          {promoter.totalPosts}
                          {promoter.requiredPosts > 0 && (
                            <span className="text-muted-foreground ml-1">
                              / {promoter.requiredPosts}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-[10px] sm:text-xs text-muted-foreground px-2 sm:px-4">
                        {promoter.requiredPosts > 0 || promoter.requiredSales > 0 ? (
                          <>
                            {promoter.requiredPosts > 0 && `${promoter.requiredPosts}P`}
                            {promoter.requiredPosts > 0 && promoter.requiredSales > 0 && ' + '}
                            {promoter.requiredSales > 0 && `${promoter.requiredSales}V`}
                          </>
                        ) : (
                          'Sem meta'
                        )}
                      </TableCell>
                      <TableCell className="text-center px-2 sm:px-4">
                        {promoter.goalAchieved ? (
                          <span className="text-[10px] sm:text-xs text-green-600 dark:text-green-400">Técnica</span>
                        ) : promoter.manualApproval ? (
                          <span className="text-[10px] sm:text-xs text-violet-600 dark:text-violet-400">Manual</span>
                        ) : (
                          <span className="text-[10px] sm:text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center px-2 sm:px-4">
                        {getApprovalBadge(promoter)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum promotor com submissões aprovadas neste evento
          </div>
        )}
      </CardContent>
    </Card>
  );
};