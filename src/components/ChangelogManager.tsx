import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Bug, TrendingUp, Shield, AlertTriangle, Plus, Trash2, Calendar, User, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ChangelogEntry {
  id: string;
  version: string;
  change_type: 'feature' | 'bugfix' | 'improvement' | 'security' | 'breaking';
  title: string;
  description: string;
  author_id: string | null;
  author_name: string | null;
  affected_modules: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

const CHANGE_TYPE_CONFIG = {
  feature: { label: 'Nova Funcionalidade', icon: Sparkles, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  bugfix: { label: 'Correção de Bug', icon: Bug, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  improvement: { label: 'Melhoria', icon: TrendingUp, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  security: { label: 'Segurança', icon: Shield, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  breaking: { label: 'Breaking Change', icon: AlertTriangle, color: 'text-orange-500', bgColor: 'bg-orange-500/10' }
};

const SEVERITY_CONFIG = {
  low: { label: 'Baixo', color: 'bg-gray-500' },
  medium: { label: 'Médio', color: 'bg-blue-500' },
  high: { label: 'Alto', color: 'bg-orange-500' },
  critical: { label: 'Crítico', color: 'bg-red-500' }
};

const MODULE_OPTIONS = [
  { value: 'painel_master', label: 'Painel Master' },
  { value: 'painel_agencia', label: 'Painel Agência' },
  { value: 'dashboard_usuario', label: 'Dashboard Usuário' },
  { value: 'submissoes', label: 'Submissões' },
  { value: 'backend', label: 'Backend/API' },
  { value: 'geral', label: 'Geral' }
];

export const ChangelogManager = () => {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteEntry, setDeleteEntry] = useState<ChangelogEntry | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [version, setVersion] = useState("");
  const [changeType, setChangeType] = useState<string>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<string>("low");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      
      // Verificar permissão de master admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('system_changelog')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar changelog:', error);
        if (error.code === 'PGRST301' || error.message?.includes('permission')) {
          toast.error('Você não tem permissão para acessar o changelog. Faça logout e login novamente.');
        } else {
          toast.error(`Erro ao carregar changelog: ${error.message}`);
        }
        throw error;
      }
      
      setEntries((data || []) as ChangelogEntry[]);
    } catch (error: any) {
      console.error('Erro ao carregar changelog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!version || !title || !description || selectedModules.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('system_changelog')
        .insert({
          version,
          change_type: changeType,
          title,
          description,
          author_id: user?.id || null,
          author_name: user?.email || 'Sistema',
          affected_modules: selectedModules,
          severity
        });

      if (error) throw error;

      toast.success('Entrada adicionada com sucesso!');
      setIsAddDialogOpen(false);
      resetForm();
      loadEntries();
    } catch (error: any) {
      console.error('Erro ao adicionar entrada:', error);
      toast.error('Erro ao adicionar entrada');
    }
  };

  const handleDeleteEntry = async () => {
    if (!deleteEntry) return;

    try {
      const { error } = await supabase
        .from('system_changelog')
        .delete()
        .eq('id', deleteEntry.id);

      if (error) throw error;

      toast.success('Entrada deletada com sucesso!');
      setDeleteEntry(null);
      loadEntries();
    } catch (error: any) {
      console.error('Erro ao deletar entrada:', error);
      toast.error('Erro ao deletar entrada');
    }
  };

  const resetForm = () => {
    setVersion("");
    setChangeType("feature");
    setTitle("");
    setDescription("");
    setSeverity("low");
    setSelectedModules([]);
  };

  const toggleModule = (moduleValue: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleValue)
        ? prev.filter(m => m !== moduleValue)
        : [...prev, moduleValue]
    );
  };

  const filteredEntries = entries.filter(entry => {
    const matchesType = filterType === "all" || entry.change_type === filterType;
    const matchesModule = filterModule === "all" || entry.affected_modules.includes(filterModule);
    const matchesSearch = searchTerm === "" || 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesModule && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Changelog do Sistema</h2>
          <p className="text-muted-foreground">Histórico de alterações e melhorias</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Entrada
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Entrada no Changelog</DialogTitle>
              <DialogDescription>
                Adicione uma nova entrada para documentar alterações no sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Versão *</Label>
                  <Input
                    id="version"
                    placeholder="v1.2.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select value={changeType} onValueChange={setChangeType}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHANGE_TYPE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="Título da alteração"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva a alteração em detalhes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severidade</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger id="severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Módulos Afetados *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {MODULE_OPTIONS.map(module => (
                    <div key={module.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={module.value}
                        checked={selectedModules.includes(module.value)}
                        onCheckedChange={() => toggleModule(module.value)}
                      />
                      <label
                        htmlFor={module.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {module.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddEntry}>
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Input
                  placeholder="Buscar por título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(CHANGE_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Módulo</Label>
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os módulos</SelectItem>
                  {MODULE_OPTIONS.map(module => (
                    <SelectItem key={module.value} value={module.value}>
                      {module.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando changelog...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma entrada encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry, index) => {
            const typeConfig = CHANGE_TYPE_CONFIG[entry.change_type];
            const Icon = typeConfig.icon;
            const severityConfig = SEVERITY_CONFIG[entry.severity];

            return (
              <Card key={entry.id} className="relative">
                {index !== filteredEntries.length - 1 && (
                  <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-border -mb-4" />
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${typeConfig.bgColor}`}>
                        <Icon className={`h-5 w-5 ${typeConfig.color}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{entry.title}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {entry.version}
                          </Badge>
                          <Badge className={`${severityConfig.color} text-white text-xs`}>
                            {severityConfig.label}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(entry.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          {entry.author_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {entry.author_name}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteEntry(entry)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {entry.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {entry.affected_modules.map(module => {
                      const moduleConfig = MODULE_OPTIONS.find(m => m.value === module);
                      return (
                        <Badge key={module} variant="secondary" className="text-xs">
                          {moduleConfig?.label || module}
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t">
                    <Badge variant="outline" className={`${typeConfig.color} text-xs`}>
                      {typeConfig.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteEntry} onOpenChange={() => setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta entrada do changelog?
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="font-medium text-foreground">{deleteEntry?.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{deleteEntry?.version}</p>
              </div>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEntry}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
