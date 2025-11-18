import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Bell, CheckCircle, XCircle, MousePointer, Smartphone, Monitor } from "lucide-react";

interface AnalyticsData {
  totalSent: number;
  totalDelivered: number;
  totalClicked: number;
  totalFailed: number;
  deliveryRate: number;
  clickRate: number;
  byDevice: Array<{ name: string; count: number }>;
  byBrowser: Array<{ name: string; count: number }>;
  byDay: Array<{ date: string; sent: number; delivered: number; clicked: number }>;
  recentNotifications: Array<{
    title: string;
    sent_at: string;
    delivered: boolean;
    clicked: boolean;
    type: string;
  }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function PushNotificationAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Buscar logs de notificações
      const { data: logs, error } = await supabase
        .from("notification_logs")
        .select("*")
        .gte("sent_at", startDate.toISOString())
        .order("sent_at", { ascending: false });

      if (error) throw error;

      if (!logs || logs.length === 0) {
        setData({
          totalSent: 0,
          totalDelivered: 0,
          totalClicked: 0,
          totalFailed: 0,
          deliveryRate: 0,
          clickRate: 0,
          byDevice: [],
          byBrowser: [],
          byDay: [],
          recentNotifications: [],
        });
        return;
      }

      // Calcular métricas gerais
      const totalSent = logs.length;
      const totalDelivered = logs.filter(l => l.delivered).length;
      const totalClicked = logs.filter(l => l.clicked).length;
      const totalFailed = totalSent - totalDelivered;
      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;

      // Agrupar por tipo de notificação
      const typeCounts: Record<string, number> = {};
      logs.forEach(log => {
        const type = log.type || 'other';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      const byDevice = Object.entries(typeCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Agrupar por status (entregue/não entregue)
      const browserCounts: Record<string, number> = {
        'Entregues': logs.filter(l => l.delivered).length,
        'Não Entregues': logs.filter(l => !l.delivered).length,
        'Clicadas': logs.filter(l => l.clicked).length,
      };

      const byBrowser = Object.entries(browserCounts)
        .map(([name, count]) => ({ name, count }))
        .filter(item => item.count > 0);

      // Agrupar por dia
      const dayGroups: Record<string, { sent: number; delivered: number; clicked: number }> = {};
      logs.forEach(log => {
        const date = new Date(log.sent_at).toISOString().split('T')[0];
        if (!dayGroups[date]) {
          dayGroups[date] = { sent: 0, delivered: 0, clicked: 0 };
        }
        dayGroups[date].sent++;
        if (log.delivered) dayGroups[date].delivered++;
        if (log.clicked) dayGroups[date].clicked++;
      });

      const byDay = Object.entries(dayGroups)
        .map(([date, counts]) => ({ date, ...counts }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14); // Últimos 14 dias

      // Notificações recentes
      const recentNotifications = logs.slice(0, 10).map(log => ({
        title: log.title,
        sent_at: log.sent_at,
        delivered: log.delivered || false,
        clicked: log.clicked || false,
        type: log.type || 'general',
      }));

      setData({
        totalSent,
        totalDelivered,
        totalClicked,
        totalFailed,
        deliveryRate,
        clickRate,
        byDevice,
        byBrowser,
        byDay,
        recentNotifications,
      });
    } catch (error) {
      console.error("Erro ao carregar analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics de Push Notifications</CardTitle>
          <CardDescription>Nenhum dado disponível</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">📊 Push Notifications Analytics</h2>
          <p className="text-muted-foreground">Métricas de entrega e engajamento</p>
        </div>
        <div className="flex gap-2">
          <Badge
            variant={timeRange === '7d' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setTimeRange('7d')}
          >
            7 dias
          </Badge>
          <Badge
            variant={timeRange === '30d' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setTimeRange('30d')}
          >
            30 dias
          </Badge>
          <Badge
            variant={timeRange === '90d' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setTimeRange('90d')}
          >
            90 dias
          </Badge>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Enviadas</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSent.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.deliveryRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {data.totalDelivered} de {data.totalSent}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Cliques</CardTitle>
            <MousePointer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.clickRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {data.totalClicked} cliques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Falhas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalFailed}</div>
            <p className="text-xs text-muted-foreground">
              {((data.totalFailed / data.totalSent) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução temporal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Diária</CardTitle>
            <CardDescription>Últimos 14 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.byDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sent" stroke="#3b82f6" name="Enviadas" />
                <Line type="monotone" dataKey="delivered" stroke="#10b981" name="Entregues" />
                <Line type="monotone" dataKey="clicked" stroke="#f59e0b" name="Clicadas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Por tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.byDevice}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.byDevice.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Por status */}
        <Card>
          <CardHeader>
            <CardTitle>Status de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.byBrowser}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Notificações recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Notificações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {data.recentNotifications.map((notif, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{notif.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notif.sent_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {notif.delivered ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {notif.clicked && <MousePointer className="h-4 w-4 text-blue-500" />}
                    <Badge variant="outline" className="text-xs">
                      {notif.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
