import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/lib/supabaseSafe";
import { TrendingUp, Users, CheckCircle, Clock, DollarSign, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ConversionStats {
  totalTrials: number;
  activeTrials: number;
  expiredTrials: number;
  convertedToPaid: number;
  conversionRate: number;
  averageTrialDuration: number;
}

export const ConversionDashboard = () => {
  const [stats, setStats] = useState<ConversionStats>({
    totalTrials: 0,
    activeTrials: 0,
    expiredTrials: 0,
    convertedToPaid: 0,
    conversionRate: 0,
    averageTrialDuration: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversionStats();
  }, []);

  const loadConversionStats = async () => {
    try {
      // Buscar todas as agências
      const { data: agencies } = await sb
        .from('agencies')
        .select('*');

      if (!agencies) return;

      const now = new Date();
      
      // Calcular estatísticas
      const totalTrials = agencies.filter(a => a.trial_start_date).length;
      const activeTrials = agencies.filter(a => 
        a.subscription_status === 'trial' &&
        a.trial_start_date &&
        a.trial_end_date &&
        new Date(a.trial_end_date) > now
      ).length;
      
      const expiredTrials = agencies.filter(a => 
        a.trial_start_date &&
        a.trial_end_date &&
        new Date(a.trial_end_date) <= now &&
        a.subscription_status === 'trial'
      ).length;
      
      const convertedToPaid = agencies.filter(a => 
        a.trial_start_date &&
        a.subscription_status === 'active'
      ).length;

      const conversionRate = totalTrials > 0 ? (convertedToPaid / totalTrials) * 100 : 0;

      // Calcular duração média de trial (em dias)
      const trialsWithDuration = agencies.filter(a => a.trial_start_date && a.trial_end_date);
      const avgDuration = trialsWithDuration.length > 0
        ? trialsWithDuration.reduce((sum, a) => {
            const start = new Date(a.trial_start_date!).getTime();
            const end = new Date(a.trial_end_date!).getTime();
            return sum + (end - start) / (1000 * 60 * 60 * 24);
          }, 0) / trialsWithDuration.length
        : 0;

      setStats({
        totalTrials,
        activeTrials,
        expiredTrials,
        convertedToPaid,
        conversionRate,
        averageTrialDuration: Math.round(avgDuration),
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas de conversão:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Trial Ativo', value: stats.activeTrials, color: 'hsl(var(--primary))' },
    { name: 'Trial Expirado', value: stats.expiredTrials, color: 'hsl(var(--destructive))' },
    { name: 'Convertido', value: stats.convertedToPaid, color: 'hsl(var(--chart-2))' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-20 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Trials</p>
              <h3 className="text-2xl font-bold mt-2">{stats.totalTrials}</h3>
            </div>
            <Users className="w-10 h-10 text-primary opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Trials Ativos</p>
              <h3 className="text-2xl font-bold mt-2">{stats.activeTrials}</h3>
            </div>
            <Clock className="w-10 h-10 text-primary opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Trials Expirados</p>
              <h3 className="text-2xl font-bold mt-2">{stats.expiredTrials}</h3>
            </div>
            <Target className="w-10 h-10 text-destructive opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Convertidos</p>
              <h3 className="text-2xl font-bold mt-2">{stats.convertedToPaid}</h3>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <h3 className="text-2xl font-bold mt-2">{stats.conversionRate.toFixed(1)}%</h3>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Duração Média Trial</p>
              <h3 className="text-2xl font-bold mt-2">{stats.averageTrialDuration} dias</h3>
            </div>
            <DollarSign className="w-10 h-10 text-primary opacity-20" />
          </div>
        </Card>
      </div>

      {/* Gráfico de Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Distribuição de Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="hsl(var(--primary))" name="Agências" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">💡 Insights</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <p className="text-sm">
              {stats.conversionRate >= 50 
                ? "✅ Excelente taxa de conversão! Continue focando na experiência durante o trial."
                : stats.conversionRate >= 30
                ? "⚠️ Taxa de conversão moderada. Considere melhorar o onboarding e suporte."
                : "❌ Taxa de conversão baixa. Revise o processo de trial e ofereça mais suporte."}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <p className="text-sm">
              {stats.activeTrials > 0 
                ? `Você tem ${stats.activeTrials} agências em trial agora. Entre em contato para aumentar conversão!`
                : "Nenhum trial ativo no momento."}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <p className="text-sm">
              {stats.expiredTrials > 0 
                ? `⏰ ${stats.expiredTrials} trials expiraram. Considere contato de recuperação!`
                : "Nenhum trial expirado sem conversão."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};