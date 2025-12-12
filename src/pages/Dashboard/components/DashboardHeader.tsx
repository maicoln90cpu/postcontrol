import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { RefreshDataButton } from "@/components/RefreshDataButton";
import { LogOut, Users } from "lucide-react";
import { motion } from "framer-motion";
import type { Profile } from "@/types/dashboard";

interface DashboardHeaderProps {
  profile: Profile;
  user: { id: string; email?: string } | null;
  avatarPreview: string | null;
  isMasterAdmin: boolean;
  isAgencyAdmin: boolean;
  isGuest: boolean;
  guestData: any;
  userAgencies: Array<{ id: string; name: string }>;
  selectedAgencyId: string;
  onAgencyChange: (agencyId: string) => void;
  onRefresh: () => Promise<void>;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
}

export function DashboardHeader({
  profile,
  user,
  avatarPreview,
  isMasterAdmin,
  isAgencyAdmin,
  isGuest,
  guestData,
  userAgencies,
  selectedAgencyId,
  onAgencyChange,
  onRefresh,
  onNavigate,
  onSignOut,
}: DashboardHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-card/80 backdrop-blur-lg border-primary/20 shadow-xl overflow-hidden">
        <div className="relative p-4 sm:p-6 md:p-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="md:flex-row md:items-center md:justify-between sm:gap-6 items-center justify-center flex flex-col py-[10px] px-0 mx-0 gap-[16px]">
            {/* User Info Section */}
            <div className="sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full overflow-hidden flex flex-row">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 ring-4 ring-primary/20 shadow-lg flex-shrink-0">
                <AvatarImage src={avatarPreview || undefined} alt={profile.full_name || "Avatar"} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10">
                  {profile.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
                    Olá, {profile.full_name || "Usuário"}!
                  </h1>
                  {isMasterAdmin && (
                    <Badge variant="default" className="bg-purple-500">
                      Master Admin
                    </Badge>
                  )}
                  {isAgencyAdmin && !isMasterAdmin && (
                    <Badge variant="default" className="bg-blue-500">
                      Agency Admin
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm sm:text-base break-all text-left">
                  {profile.email}
                </p>
                {profile.instagram && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    📱 @{profile.instagram}
                  </p>
                )}
                
                {/* Agency Selector */}
                {userAgencies && userAgencies.length > 1 && (
                  <Select value={selectedAgencyId} onValueChange={onAgencyChange}>
                    <SelectTrigger className="w-full sm:w-[280px] bg-background/50">
                      <SelectValue placeholder="Selecione a agência" />
                    </SelectTrigger>
                    <SelectContent>
                      {userAgencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex-wrap items-center justify-center flex flex-row gap-[18px]">
              <RefreshDataButton 
                onRefresh={onRefresh} 
                size="icon" 
                showLabel={false}
                aria-label="Atualizar dados"
              />
              <ThemeToggle />
              <NotificationBell userId={user!.id} />

              <Button
                onClick={() => onNavigate("/submit")}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                Enviar Nova Postagem
              </Button>

              {/* Guest Dashboard Button */}
              {isGuest && guestData && (
                <Button
                  onClick={() => onNavigate("/guest-dashboard")}
                  variant="outline"
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Painel Convidado
                </Button>
              )}

              {isMasterAdmin && (
                <Button onClick={() => onNavigate("/master-admin")} variant="outline">
                  Master Admin
                </Button>
              )}

              {isAgencyAdmin && (
                <Button onClick={() => onNavigate("/admin")} variant="outline">
                  Painel Admin
                </Button>
              )}

              <Button 
                onClick={onSignOut} 
                variant="ghost" 
                size="icon"
                aria-label="Sair da conta"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
