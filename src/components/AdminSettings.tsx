import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Save, Globe, Clock } from "lucide-react";
import { sb } from "@/lib/supabaseSafe";
import { toast } from "sonner";
import { MigrationUserGoalsButton } from "./MigrationUserGoalsButton";
import { invalidateTimezoneCache } from "@/lib/dateUtils";

interface AdminSettingsProps {
  isMasterAdmin?: boolean;
}

const TIMEZONE_OPTIONS = [
  { value: "America/Sao_Paulo", label: "São Paulo (BRT - UTC-3)" },
  { value: "America/Fortaleza", label: "Fortaleza (BRT - UTC-3)" },
  { value: "America/Recife", label: "Recife (BRT - UTC-3)" },
  { value: "America/Bahia", label: "Bahia (BRT - UTC-3)" },
  { value: "America/Manaus", label: "Manaus (AMT - UTC-4)" },
  { value: "America/Cuiaba", label: "Cuiabá (AMT - UTC-4)" },
  { value: "America/Porto_Velho", label: "Porto Velho (AMT - UTC-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (ACT - UTC-5)" },
  { value: "America/Noronha", label: "Fernando de Noronha (FNT - UTC-2)" },
];

export const AdminSettings = ({ isMasterAdmin = false }: AdminSettingsProps) => {
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [gtmId, setGtmId] = useState("");
  const [systemTimezone, setSystemTimezone] = useState("America/Sao_Paulo");
  const [aiInsightsEnabled, setAiInsightsEnabled] = useState(true);
  const [badgesEnabled, setBadgesEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data: settings, error } = await sb
      .from("admin_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["whatsapp_number", "custom_domain", "gtm_id", "ai_insights_enabled", "badges_enabled", "system_timezone"]);

    if (error) {
      console.error("Error loading settings:", error);
      return;
    }

    if (settings) {
      const whatsapp = settings.find((s) => s.setting_key === "whatsapp_number");
      const domain = settings.find((s) => s.setting_key === "custom_domain");
      const gtm = settings.find((s) => s.setting_key === "gtm_id");
      const aiInsights = settings.find((s) => s.setting_key === "ai_insights_enabled");
      const badges = settings.find((s) => s.setting_key === "badges_enabled");
      const timezone = settings.find((s) => s.setting_key === "system_timezone");

      setWhatsappNumber(whatsapp?.setting_value || "");
      setCustomDomain(domain?.setting_value || "");
      setGtmId(gtm?.setting_value || "");
      setAiInsightsEnabled(aiInsights?.setting_value === "true");
      setBadgesEnabled(badges?.setting_value === "true");
      setSystemTimezone(timezone?.setting_value || "America/Sao_Paulo");
    }
  };

  const handleSave = async () => {
    setLoading(true);

    // Validar formato do número
    const cleanNumber = whatsappNumber.replace(/\D/g, "");
    if (whatsappNumber && (cleanNumber.length < 10 || cleanNumber.length > 11)) {
      toast.error("Número de telefone inválido. Use o formato: (00) 00000-0000");
      setLoading(false);
      return;
    }

    // Validar URL customizada
    if (customDomain && !customDomain.startsWith("http")) {
      toast.error("URL deve começar com http:// ou https://");
      setLoading(false);
      return;
    }

    try {
      // Atualizar custom domain (apenas master admin)
      if (isMasterAdmin) {
        await sb.from("admin_settings").upsert(
          {
            setting_key: "custom_domain",
            setting_value: customDomain.replace(/\/$/, ""),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "setting_key" },
        );

        // Atualizar GTM ID
        await sb.from("admin_settings").upsert(
          {
            setting_key: "gtm_id",
            setting_value: gtmId.trim(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "setting_key" },
        );

        // Atualizar System Timezone
        await sb.from("admin_settings").upsert(
          {
            setting_key: "system_timezone",
            setting_value: systemTimezone,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "setting_key" },
        );
        
        // Invalidar cache de timezone após salvar
        invalidateTimezoneCache();

        // Atualizar WhatsApp Master
        await sb.from("admin_settings").upsert(
          {
            setting_key: "whatsapp_number",
            setting_value: whatsappNumber || "",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "setting_key" },
        );
      }

      // Atualizar AI Insights (apenas master admin)
      if (isMasterAdmin) {
        await sb.from("admin_settings").upsert(
          {
            setting_key: "ai_insights_enabled",
            setting_value: aiInsightsEnabled ? "true" : "false",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "setting_key" },
        );

        // Atualizar Badges
        await sb.from("admin_settings").upsert(
          {
            setting_key: "badges_enabled",
            setting_value: badgesEnabled ? "true" : "false",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "setting_key" },
        );
      }

      toast.success("Configurações salvas com sucesso!");

      // Recarregar as configurações para confirmar o salvamento
      await loadSettings();
    } catch (error: any) {
      console.error("Error saving settings:", error);

      if (error.code === "42501") {
        toast.error("Erro de permissão: Você não tem acesso para salvar essas configurações");
      } else {
        toast.error("Erro ao salvar configurações: " + error.message);
      }
    }

    setLoading(false);
  };

  return (
    <>
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">⚙️ Configurações</h2>
          <p className="text-muted-foreground text-sm">
            {isMasterAdmin ? "Configure as informações globais da plataforma" : "Configure o WhatsApp para suporte"}
          </p>
        </div>

        <div className="space-y-6">
          {/* System Timezone - Only for Master Admin */}
          {isMasterAdmin && (
            <div className="space-y-2">
              <Label htmlFor="system-timezone">
                <Clock className="inline mr-2 h-4 w-4" />
                Fuso Horário do Sistema
              </Label>
              <Select value={systemTimezone} onValueChange={setSystemTimezone}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fuso horário" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define o fuso horário usado para todas as datas e horários do sistema.
                <br />
                Afeta filtragem de eventos, desativação automática e exibição de horários.
              </p>
            </div>
          )}

          {/* URL Base - Only for Master Admin */}
          {isMasterAdmin && (
            <div className="space-y-2">
              <Label htmlFor="customDomain">
                <Globe className="inline mr-2 h-4 w-4" />
                URL Base para Links de Agência
              </Label>
              <Input
                id="customDomain"
                placeholder="https://seudominio.com.br"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Esta URL será usada para gerar links de convite das agências.
                <br />
                <strong>Exemplo:</strong> {customDomain || "https://seudominio.com.br"}/agency/nome-agencia
              </p>
            </div>
          )}

          {/* Google Tag Manager ID - Only for Master Admin */}
          {isMasterAdmin && (
            <div className="space-y-2">
              <Label htmlFor="gtmId">Google Tag Manager ID</Label>
              <Input
                id="gtmId"
                placeholder="GTM-M39XRQFM"
                value={gtmId}
                onChange={(e) => setGtmId(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                ID do container do Google Tag Manager para rastreamento de eventos e conversões.
                <br />
                <strong>Exemplo:</strong> GTM-ABC1234
              </p>
            </div>
          )}

          {/* Features Control - Only for Master Admin */}
          {isMasterAdmin && (
            <>
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <h3 className="font-semibold text-sm">Funcionalidades do Dashboard</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Insights com IA</Label>
                    <p className="text-xs text-muted-foreground">
                      Mostrar análises de desempenho com inteligência artificial
                    </p>
                  </div>
                  <Switch checked={aiInsightsEnabled} onCheckedChange={setAiInsightsEnabled} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sistema de Badges</Label>
                    <p className="text-xs text-muted-foreground">Exibir sistema de conquistas e badges para usuários</p>
                  </div>
                  <Switch checked={badgesEnabled} onCheckedChange={setBadgesEnabled} />
                </div>
              </div>

              {/* WhatsApp Master - Only for Master Admin */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp">
                  <Phone className="inline mr-2 h-4 w-4" />
                  WhatsApp Master (Suporte para Agências)
                </Label>
                <Input
                  id="whatsapp"
                  placeholder="5511999999999"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Este número aparece para os <strong>donos de agência</strong> quando 
                  precisam de suporte. Use formato: 55 + DDD + número
                </p>
              </div>
            </>
          )}

          {/* WhatsApp - Available for all admins */}
          {!isMasterAdmin && (
            <div className="space-y-2">
              <Label htmlFor="whatsapp">
                <Phone className="inline mr-2 h-4 w-4" />
                Número do WhatsApp (Opcional)
              </Label>
              <Input
                id="whatsapp"
                placeholder="(00) 00000-0000"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Os usuários poderão clicar em um botão para falar diretamente com você pelo WhatsApp
              </p>
            </div>
          )}

          <Button onClick={handleSave} disabled={loading} className="bg-gradient-primary">
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </Card>

      {isMasterAdmin && (
        <div className="mt-6">
          <MigrationUserGoalsButton />
        </div>
      )}
    </>
  );
};
