import { memo, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, Building2, CreditCard, Lightbulb, Clock, XCircle, 
  MessageSquare, ArrowLeft, Send, Copy 
} from "lucide-react";

const SlotExhaustionAlert = lazy(() => import("@/components/SlotExhaustionAlert").then(m => ({
  default: m.SlotExhaustionAlert
})));

interface TrialInfo {
  inTrial: boolean;
  expired: boolean;
  daysRemaining: number;
}

interface AdminHeaderProps {
  profile: any;
  currentAgency: any;
  trialInfo: TrialInfo | null;
  agencySlug: string;
  isMasterAdmin: boolean;
  onCopySlugUrl: () => void;
  onSuggestionClick: () => void;
  onSignOut: () => void;
}

export const AdminHeader = memo(({
  profile,
  currentAgency,
  trialInfo,
  agencySlug,
  isMasterAdmin,
  onCopySlugUrl,
  onSuggestionClick,
  onSignOut
}: AdminHeaderProps) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Admin Context Header */}
      <div className="bg-gradient-primary text-white py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex-wrap gap-4 flex-col flex items-center justify-between">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile.avatar_url} alt={`Avatar ${profile.full_name}`} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
            ) : currentAgency?.name ? (
              <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-white">
                  {currentAgency.name.charAt(0).toUpperCase()}
                </span>
              </div>
            ) : null}
            <div>
              <h2 className="text-xl font-bold">{profile?.full_name || "Admin"}</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
                <span>{profile?.email}</span>
                {currentAgency && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {currentAgency.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          {currentAgency && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Badge variant="secondary" className="text-base px-4 py-2 w-full sm:w-auto text-center">
                Plano: {currentAgency.subscription_plan?.toUpperCase() || "BASIC"}
              </Badge>
              <Button
                onClick={() => {
                  window.location.href = "/#precos";
                }}
                variant="secondary"
                size="sm"
                className="font-semibold w-full sm:w-auto"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {trialInfo?.inTrial ? "Assinar Agora" : "Gerenciar Assinatura"}
              </Button>
              <Button
                onClick={onSuggestionClick}
                size="sm"
                className="gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5 w-full sm:w-auto"
              >
                <Lightbulb className="h-5 w-5" />
                Enviar Sugestão
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Trial Banners */}
      {trialInfo?.inTrial && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">🎉 Trial Ativo</h3>
                  <p className="text-white/90">
                    Você tem{" "}
                    <strong>
                      {trialInfo.daysRemaining} dia{trialInfo.daysRemaining !== 1 ? "s" : ""}
                    </strong>{" "}
                    restante{trialInfo.daysRemaining !== 1 ? "s" : ""} para testar gratuitamente!
                  </p>
                </div>
              </div>
              <Button
                onClick={() => (window.location.href = "/#precos")}
                className="bg-white text-green-600 hover:bg-white/90"
              >
                Ver Planos
              </Button>
            </div>
          </div>
        </div>
      )}

      {trialInfo?.expired && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">⚠️ Trial Expirado</h3>
                  <p className="text-white/90">
                    Seu período de teste acabou. <strong>Assine agora</strong> para continuar editando!
                  </p>
                </div>
              </div>
              <Button
                onClick={() => (window.location.href = "/#precos")}
                className="bg-white text-red-600 hover:bg-white/90 font-bold"
              >
                Assinar Agora
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Slot Exhaustion Alerts */}
      {currentAgency && (
        <div className="container mx-auto px-4 pt-6">
          <Suspense fallback={null}>
            <SlotExhaustionAlert />
          </Suspense>
        </div>
      )}

      {/* Agency Filter Indicator */}
      {currentAgency && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentAgency.logo_url && (
                  <img
                    src={currentAgency.logo_url}
                    alt={`Logo ${currentAgency.name}`}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="h-20 w-20 object-contain rounded-lg bg-card p-1"
                  />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Visualizando dados de:</p>
                  <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {currentAgency.name}
                  </h3>
                </div>
              </div>
              {isMasterAdmin && (
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate("/master-admin");
                  }}
                >
                  ← Voltar ao Painel Master
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              {isMasterAdmin && !currentAgency && (
                <Link to="/master-admin">
                  <Button variant="outline" size="sm">
                    🎯 Painel Master
                  </Button>
                </Link>
              )}
              <div className="flex flex-col gap-2">
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Painel Agência
                </h1>
                {agencySlug && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Link da sua agência:</span>
                    <Badge variant="outline" className="text-sm">
                      <Building2 className="h-3 w-3 mr-1" />
                      {agencySlug}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCopySlugUrl}
                      className="h-6 w-6 p-0"
                      title="Copiar link de cadastro"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                onClick={() => {
                  const message = encodeURIComponent(
                    `Olá! Preciso de suporte - Agência: ${currentAgency?.name || "Sem nome"}`
                  );
                  window.open(`https://wa.me/5511999136884?text=${message}`, "_blank");
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg transition-all hover:scale-105 flex items-center gap-2 flex-1 sm:flex-initial"
                size="sm"
              >
                <MessageSquare className="h-5 w-5" />
                Suporte WhatsApp
              </Button>
              <Link to="/submit" className="flex-1 sm:flex-initial">
                <Button variant="outline" className="w-full sm:w-auto" size="sm">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Postagem
                </Button>
              </Link>
              <Button variant="outline" onClick={onSignOut} className="flex-1 sm:flex-initial" size="sm">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
});

AdminHeader.displayName = "AdminHeader";
