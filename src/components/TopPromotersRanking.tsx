import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface TopPromotersRankingProps {
  eventId: string;
  limit?: number;
}

interface PromoterRank {
  user_id: string;
  full_name: string;
  avatar_url: string;
  current_posts: number;
  current_sales: number;
  required_posts: number;
  required_sales: number;
  completion_percentage: number;
  goal_achieved: boolean;
  rank: number;
  achieved_requirement_id?: string;
  manual_approval?: boolean;
  manual_approval_reason?: string;
}

export const TopPromotersRanking = ({ eventId, limit = 10 }: TopPromotersRankingProps) => {
  const { data: ranking, isLoading } = useQuery({
    queryKey: ['top-promoters', eventId, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_promoters_ranking', {
        p_event_id: eventId,
        p_limit: limit,
      });

      if (error) throw error;
      return data as PromoterRank[];
    },
    enabled: !!eventId,
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-700" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🏆 Ranking de Divulgadoras</CardTitle>
          <CardDescription>Top performers do evento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!ranking || ranking.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🏆 Ranking de Divulgadoras</CardTitle>
          <CardDescription>Nenhuma submissão ainda</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🏆 Ranking de Divulgadoras</CardTitle>
        <CardDescription>
          Top {limit} performers do evento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ranking.map((promoter) => (
            <div
              key={promoter.user_id}
              className={`flex items-center gap-3 p-4 sm:p-3 rounded-lg transition-colors ${
                promoter.goal_achieved 
                  ? 'bg-green-500/10 border border-green-500/20' 
                  : promoter.manual_approval
                  ? 'bg-violet-500/10 border border-violet-500/20'
                  : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2 shrink-0">
                {getRankIcon(promoter.rank)}
                <span className="text-base sm:text-sm font-bold text-muted-foreground">
                  {promoter.rank}º
                </span>
              </div>

              <Avatar className="h-11 w-11 sm:h-10 sm:w-10 shrink-0">
                <AvatarImage src={promoter.avatar_url} />
                <AvatarFallback>
                  {promoter.full_name?.slice(0, 2).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{promoter.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {promoter.current_posts}P + {promoter.current_sales}V
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {promoter.goal_achieved ? (
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20 cursor-help text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Meta
                      </Badge>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">✅ Meta Conquistada</p>
                        <p className="text-xs text-muted-foreground">
                          Completou: {promoter.required_posts} posts + {promoter.required_sales} vendas
                        </p>
                        {promoter.achieved_requirement_id && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            🎯 Vaga garantida no evento
                          </p>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ) : promoter.manual_approval ? (
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Badge className="bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20 cursor-help text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        Aprovada
                      </Badge>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">🏅 Aprovada pela Agência</p>
                        {promoter.manual_approval_reason && (
                          <p className="text-xs text-muted-foreground italic">
                            "{promoter.manual_approval_reason}"
                          </p>
                        )}
                        <p className="text-xs text-violet-600 dark:text-violet-400">
                          🎯 Vaga garantida manualmente
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    {promoter.completion_percentage}%
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};