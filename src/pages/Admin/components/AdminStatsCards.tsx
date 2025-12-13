import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, Users, Trophy } from "lucide-react";

interface AdminStatsCardsProps {
  stats: {
    events: number;
    posts: number;
    submissions: number;
    users: number;
    sales: number;
  };
  loadingSalesCount: boolean;
}

export const AdminStatsCards = memo(({ stats, loadingSalesCount }: AdminStatsCardsProps) => {
  return (
    <div id="stats-cards" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Eventos Totais</p>
            <p className="text-2xl font-bold">{stats.events}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Postagens</p>
            <p className="text-2xl font-bold">{stats.posts}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Submissões</p>
            <p className="text-2xl font-bold">{stats.submissions}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Usuários</p>
            <p className="text-2xl font-bold">{stats.users}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Vendas Totais</p>
            <p className="text-2xl font-bold">{loadingSalesCount ? "..." : stats.sales}</p>
          </div>
        </div>
      </Card>
    </div>
  );
});

AdminStatsCards.displayName = "AdminStatsCards";
