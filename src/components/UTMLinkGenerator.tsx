import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link, Copy, Trash2, Download, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UTMParams {
  baseUrl: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
}

interface HistoryItem {
  id: string;
  url: string;
  source: string;
  medium: string;
  campaign: string;
  timestamp: string;
}

const templates = [
  {
    name: "Post Instagram Feed",
    icon: "📸",
    description: "Para posts do feed do Instagram",
    params: {
      utm_source: "instagram",
      utm_medium: "social",
      utm_content: "post-feed"
    }
  },
  {
    name: "Stories Instagram",
    icon: "📱",
    description: "Para stories com link de arrastar",
    params: {
      utm_source: "instagram",
      utm_medium: "stories",
      utm_content: "stories-link"
    }
  },
  {
    name: "WhatsApp Grupo",
    icon: "💬",
    description: "Para compartilhar no grupo",
    params: {
      utm_source: "whatsapp",
      utm_medium: "social",
      utm_content: "grupo-promo"
    }
  },
  {
    name: "Email Marketing",
    icon: "✉️",
    description: "Para campanhas de email",
    params: {
      utm_source: "email",
      utm_medium: "newsletter",
      utm_content: "botao-principal"
    }
  }
];

const sourceOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "tiktok", label: "TikTok" },
  { value: "google", label: "Google" },
  { value: "email", label: "Email" },
  { value: "custom", label: "Outro (personalizado)" }
];

const mediumOptions = [
  { value: "social", label: "Social (redes sociais)" },
  { value: "stories", label: "Stories" },
  { value: "reels", label: "Reels" },
  { value: "email", label: "Email" },
  { value: "cpc", label: "CPC (anúncios pagos)" },
  { value: "banner", label: "Banner" },
  { value: "newsletter", label: "Newsletter" },
  { value: "custom", label: "Outro (personalizado)" }
];

export const UTMLinkGenerator = () => {
  const [params, setParams] = useState<UTMParams>({
    baseUrl: "",
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: ""
  });

  const [customSource, setCustomSource] = useState("");
  const [customMedium, setCustomMedium] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Carregar histórico do localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("utm_link_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Gerar URL automaticamente
  useEffect(() => {
    generateUrl();
  }, [params, customSource, customMedium]);

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const generateUrl = () => {
    if (!params.baseUrl || !isValidUrl(params.baseUrl)) {
      setGeneratedUrl("");
      return;
    }

    const url = new URL(params.baseUrl);
    const source = params.utm_source === "custom" ? customSource : params.utm_source;
    const medium = params.utm_medium === "custom" ? customMedium : params.utm_medium;

    if (source) url.searchParams.set("utm_source", source);
    if (medium) url.searchParams.set("utm_medium", medium);
    if (params.utm_campaign) url.searchParams.set("utm_campaign", params.utm_campaign);
    if (params.utm_content) url.searchParams.set("utm_content", params.utm_content);
    if (params.utm_term) url.searchParams.set("utm_term", params.utm_term);

    setGeneratedUrl(url.toString());
  };

  const handleCopy = () => {
    if (!generatedUrl) {
      toast.error("Preencha os campos obrigatórios para gerar o link");
      return;
    }

    navigator.clipboard.writeText(generatedUrl);
    toast.success("Link copiado!");

    // Adicionar ao histórico
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      url: generatedUrl,
      source: params.utm_source === "custom" ? customSource : params.utm_source,
      medium: params.utm_medium === "custom" ? customMedium : params.utm_medium,
      campaign: params.utm_campaign,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [newItem, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem("utm_link_history", JSON.stringify(updatedHistory));
  };

  const handleClear = () => {
    setParams({
      baseUrl: "",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_content: "",
      utm_term: ""
    });
    setCustomSource("");
    setCustomMedium("");
    setGeneratedUrl("");
  };

  const handleTemplate = (template: typeof templates[0]) => {
    setParams({
      ...params,
      utm_source: template.params.utm_source,
      utm_medium: template.params.utm_medium,
      utm_content: template.params.utm_content
    });
  };

  const handleCopyFromHistory = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link do histórico copiado!");
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("utm_link_history");
    toast.success("Histórico limpo");
  };

  const handleExportHistory = () => {
    if (history.length === 0) {
      toast.error("Histórico vazio");
      return;
    }

    const csv = [
      ["Data", "URL", "Origem", "Canal", "Campanha"],
      ...history.map(item => [
        new Date(item.timestamp).toLocaleString("pt-BR"),
        item.url,
        item.source,
        item.medium,
        item.campaign
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `utm-links-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Histórico exportado!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            <CardTitle>Gerador de Links UTM</CardTitle>
          </div>
          <CardDescription>
            Crie links rastreáveis para medir o desempenho das suas campanhas de marketing.
            Os parâmetros UTM ajudam a identificar a origem, canal e campanha de cada visitante.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Templates Rápidos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <CardTitle className="text-base">Templates Rápidos</CardTitle>
          </div>
          <CardDescription>Clique para preencher automaticamente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template) => (
              <Button
                key={template.name}
                variant="outline"
                className="h-auto flex-col items-start p-4 hover:border-primary"
                onClick={() => handleTemplate(template)}
              >
                <div className="text-2xl mb-2">{template.icon}</div>
                <div className="font-semibold text-sm mb-1">{template.name}</div>
                <div className="text-xs text-muted-foreground text-left">{template.description}</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurar Parâmetros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Base */}
          <div>
            <Label htmlFor="baseUrl">
              URL Base <span className="text-destructive">*</span>
            </Label>
            <Input
              id="baseUrl"
              placeholder="https://seusite.com/evento"
              value={params.baseUrl}
              onChange={(e) => setParams({ ...params, baseUrl: e.target.value })}
              className={!params.baseUrl || isValidUrl(params.baseUrl) ? "" : "border-destructive"}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Link original que você deseja rastrear (página de evento, formulário, etc.)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* utm_source */}
            <div>
              <Label htmlFor="utm_source">
                Origem (utm_source) <span className="text-destructive">*</span>
              </Label>
              <Select value={params.utm_source} onValueChange={(value) => setParams({ ...params, utm_source: value })}>
                <SelectTrigger id="utm_source">
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {sourceOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {params.utm_source === "custom" && (
                <Input
                  placeholder="Digite a origem personalizada"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  className="mt-2"
                />
              )}
              <p className="text-xs text-muted-foreground mt-1">
                <strong>De onde vem o tráfego?</strong> Ex: instagram, facebook, google
              </p>
            </div>

            {/* utm_medium */}
            <div>
              <Label htmlFor="utm_medium">
                Canal (utm_medium) <span className="text-destructive">*</span>
              </Label>
              <Select value={params.utm_medium} onValueChange={(value) => setParams({ ...params, utm_medium: value })}>
                <SelectTrigger id="utm_medium">
                  <SelectValue placeholder="Selecione o canal" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {mediumOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {params.utm_medium === "custom" && (
                <Input
                  placeholder="Digite o canal personalizado"
                  value={customMedium}
                  onChange={(e) => setCustomMedium(e.target.value)}
                  className="mt-2"
                />
              )}
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Como chegou?</strong> Ex: social, email, stories, cpc
              </p>
            </div>

            {/* utm_campaign */}
            <div>
              <Label htmlFor="utm_campaign">
                Campanha (utm_campaign) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="utm_campaign"
                placeholder="evento-dna-2024"
                value={params.utm_campaign}
                onChange={(e) => setParams({ ...params, utm_campaign: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Qual campanha?</strong> Nome único do evento ou promoção
              </p>
            </div>

            {/* utm_content */}
            <div>
              <Label htmlFor="utm_content">Conteúdo (utm_content)</Label>
              <Input
                id="utm_content"
                placeholder="post-1, stories-destaque"
                value={params.utm_content}
                onChange={(e) => setParams({ ...params, utm_content: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Qual elemento?</strong> Diferencia versões da campanha (opcional)
              </p>
            </div>

            {/* utm_term */}
            <div className="md:col-span-2">
              <Label htmlFor="utm_term">Termo (utm_term)</Label>
              <Input
                id="utm_term"
                placeholder="divulgadora, festa-sp"
                value={params.utm_term}
                onChange={(e) => setParams({ ...params, utm_term: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Palavras-chave</strong> para anúncios pagos (opcional)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview e Ações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Link Gerado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg break-all text-sm font-mono">
            {generatedUrl || (
              <span className="text-muted-foreground">Preencha os campos obrigatórios (*) para gerar o link</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCopy} disabled={!generatedUrl} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Histórico de Links</CardTitle>
                <CardDescription>Últimos 10 links gerados</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportHistory}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearHistory}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-2 mb-1">
                      <Badge variant="secondary">{item.source}</Badge>
                      <Badge variant="outline">{item.medium}</Badge>
                      {item.campaign && <Badge variant="outline">{item.campaign}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{item.url}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyFromHistory(item.url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
