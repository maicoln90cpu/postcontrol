import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building2, ClipboardCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { sb } from "@/lib/supabaseSafe";
import { useUserAgenciesQuery, useAdminSettingsQuery } from "@/hooks/consolidated";
import { useDashboard } from "@/hooks/useDashboard";
import { useIsGuest } from "@/hooks/useIsGuest";
import { logger } from "@/lib/logger";

// Refactored components
import { DashboardHeader } from "./Dashboard/components/DashboardHeader";
import { DashboardInviteCard } from "./Dashboard/components/DashboardInviteCard";
import { DashboardStats } from "./Dashboard/DashboardStats";
import { DashboardSubmissionHistory } from "./Dashboard/DashboardSubmissionHistory";
import { DashboardProfile } from "./Dashboard/DashboardProfile";
import { useDashboardFilters } from "./Dashboard/useDashboardFilters";
import { useDashboardAvatar } from "./Dashboard/hooks/useDashboardAvatar";
import { useDashboardMutations } from "./Dashboard/hooks/useDashboardMutations";

// Other components
import { PushNotificationSettings } from "@/components/PushNotificationSettings";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { GoalProgressBadge } from "@/components/GoalProgressBadge";
import { DashboardWhatsappButton } from "./Dashboard_WhatsappButton";

// Lazy loading for heavy components
const TutorialGuide = lazy(() => import("@/components/TutorialGuide"));
const BadgeDisplay = lazy(() => import("@/components/BadgeDisplay").then(m => ({ default: m.BadgeDisplay })));
const SubmissionImageDisplay = lazy(() => import("@/components/SubmissionImageDisplay").then(m => ({ default: m.SubmissionImageDisplay })));

const Dashboard = () => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  // Local UI state (consolidated)
  const [selectedAgencyId, setSelectedAgencyId] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [instagram, setInstagram] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submissionToDelete, setSubmissionToDelete] = useState<{ id: string; status: string } | null>(null);
  const [agencyName, setAgencyName] = useState("");
  const [agencySupportWhatsapp, setAgencySupportWhatsapp] = useState("");

  // Admin settings state
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [badgesEnabled, setBadgesEnabled] = useState(true);

  // Guest check
  const { isGuest, guestData } = useIsGuest();

  // Filters
  const { filters: { selectedHistoryEvent }, setSelectedHistoryEvent } = useDashboardFilters();

  // Data queries
  const { data: userAgenciesData, isLoading: isLoadingAgencies } = useUserAgenciesQuery(user?.id);
  const { data: adminSettingsData, isLoading: isLoadingSettings } = useAdminSettingsQuery(["ai_insights_enabled", "badges_enabled", "whatsapp_number"]);
  const { data: dashboardData, isLoading: isLoadingDashboard, refetch } = useDashboard();

  // Derived data
  const profile = dashboardData?.profile;
  const submissions = dashboardData?.submissions || [];
  const eventStats = dashboardData?.eventStats || [];
  const events = dashboardData?.events || [];
  const isMasterAdmin = dashboardData?.isMasterAdmin || false;
  const isAgencyAdmin = dashboardData?.isAgencyAdmin || false;

  const loading = isLoadingSettings || isLoadingDashboard;

  // Avatar hook
  const {
    avatarFile,
    avatarPreview,
    uploading,
    uploadProgress,
    handleAvatarChange,
    saveAvatar,
    updatePreview,
  } = useDashboardAvatar({
    userId: user?.id || "",
    profileAgencyId: profile?.agency_id,
    initialAvatarUrl: profile?.avatar_url,
  });

  // Mutations hook
  const {
    updateProfile,
    deleteSubmission,
    changePassword,
    saveInstagram,
  } = useDashboardMutations({
    userId: user?.id || "",
    onProfileUpdate: () => refetch(),
  });

  // Filter data by selected agency
  const filteredSubmissions = useMemo(() => {
    if (!selectedAgencyId || !submissions) return submissions;
    return submissions.filter(s => {
      const eventAgencyId = s.posts?.events && typeof s.posts.events === 'object' 
        ? (s.posts.events as any).agency_id 
        : null;
      return eventAgencyId === selectedAgencyId;
    });
  }, [submissions, selectedAgencyId]);

  const filteredEvents = useMemo(() => {
    if (!selectedAgencyId || !events) return events;
    return events.filter(e => e.agency_id === selectedAgencyId);
  }, [events, selectedAgencyId]);

  const filteredEventStats = useMemo(() => {
    if (!selectedAgencyId || !eventStats || !events) return eventStats;
    return eventStats.filter(stat => {
      const event = events.find(e => e.id === stat.eventId);
      return event?.agency_id === selectedAgencyId;
    });
  }, [eventStats, events, selectedAgencyId]);

  const filteredSubmissionsByEvent = useMemo(() => {
    if (!filteredSubmissions) return [];
    return selectedHistoryEvent === "all" 
      ? filteredSubmissions 
      : filteredSubmissions.filter(s => s.posts?.event_id === selectedHistoryEvent);
  }, [filteredSubmissions, selectedHistoryEvent]);

  const lastSubmission = filteredSubmissions?.[0] || null;

  // Effects
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (userAgenciesData?.[0]) {
      setAgencyName(userAgenciesData[0].name || "");
    }

    if (adminSettingsData && !isLoadingSettings) {
      setBadgesEnabled(adminSettingsData['badges_enabled'] === "true");
      setWhatsappNumber(adminSettingsData['whatsapp_number'] || "");
    }
  }, [user, navigate, userAgenciesData, adminSettingsData, isLoadingSettings]);

  useEffect(() => {
    if (profile) {
      setSelectedGender(profile.gender || "");
      updatePreview(profile.avatar_url || null);
      setInstagram(profile.instagram || "");
    }
  }, [profile]);

  useEffect(() => {
    if (userAgenciesData?.length) {
      const savedAgencyId = localStorage.getItem('preferred_agency');
      const validSaved = savedAgencyId && userAgenciesData.some(a => a.id === savedAgencyId);
      setSelectedAgencyId(validSaved ? savedAgencyId : userAgenciesData[0].id);
    }
  }, [userAgenciesData]);

  useEffect(() => {
    if (selectedAgencyId) {
      localStorage.setItem('preferred_agency', selectedAgencyId);
      
      // Load agency WhatsApp
      sb.from('agencies')
        .select('support_whatsapp')
        .eq('id', selectedAgencyId)
        .maybeSingle()
        .then(({ data }) => setAgencySupportWhatsapp(data?.support_whatsapp || ""));
    }
  }, [selectedAgencyId]);

  useEffect(() => {
    if (user && dashboardData?.userAgencyIds?.[0]) {
      sb.from("user_agencies")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("agency_id", dashboardData.userAgencyIds[0])
        .then(() => logger.info("last_accessed_at atualizado"));
    }
  }, [user, dashboardData?.userAgencyIds]);

  // Handlers
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleDeleteSubmission = async (id: string, status: string) => {
    await deleteSubmission({ submissionId: id, status });
    setSubmissionToDelete(null);
  };

  const handleChangePassword = async () => {
    const success = await changePassword(newPassword, confirmPassword);
    if (success) {
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // No agency fallback
  if (dashboardData?.hasAgencies === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background p-8">
        <Card className="max-w-7xl mx-auto p-12 text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Nenhuma Agência Vinculada</h2>
          <p className="text-muted-foreground mb-6">
            Você precisa estar vinculado a uma agência para ver os eventos e enviar postagens.
          </p>
          <Button onClick={() => navigate("/")}>Voltar para Home</Button>
        </Card>
      </div>
    );
  }

  if (!dashboardData || !profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <DashboardHeader
          profile={profile}
          user={user}
          avatarPreview={avatarPreview}
          isMasterAdmin={isMasterAdmin}
          isAgencyAdmin={isAgencyAdmin}
          isGuest={isGuest}
          guestData={guestData}
          userAgencies={userAgenciesData || []}
          selectedAgencyId={selectedAgencyId}
          onAgencyChange={setSelectedAgencyId}
          onRefresh={async () => { await refetch(); }}
          onNavigate={navigate}
          onSignOut={handleSignOut}
        />

        {/* Badges */}
        {badgesEnabled && (
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <BadgeDisplay />
          </Suspense>
        )}

        {/* Invite Card */}
        {selectedAgencyId && (
          <DashboardInviteCard
            userId={user!.id}
            agencyId={selectedAgencyId}
            agencyName={agencyName}
            events={filteredEvents}
          />
        )}

        {/* Stats */}
        <DashboardStats
          approvedCount={filteredSubmissions.filter(s => s.status === 'approved').length}
          totalSubmissions={filteredSubmissions.length}
          activeEventsCount={filteredEventStats.length}
          lastSubmissionDate={lastSubmission?.submitted_at || null}
          eventStats={filteredEventStats}
        />

        {/* Tabs */}
        <Tabs defaultValue="statistics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="statistics" className="text-base">Estatísticas</TabsTrigger>
            <TabsTrigger value="history" className="text-base">Histórico</TabsTrigger>
            <TabsTrigger value="cadastro" className="text-base">Meu Cadastro</TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Progresso dos Eventos</h2>
              <div className="space-y-6">
                {filteredEventStats.length > 0 ? (
                  filteredEventStats.map(stat => {
                    const isManualReview = !stat.totalRequired || stat.totalRequired === 0;
                    return (
                      <div key={stat.eventId} className="space-y-3">
                        <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{stat.eventTitle}</h3>
                                {isManualReview && (
                                  <Badge variant="outline" className="border-purple-500 text-purple-700 dark:text-purple-400 text-xs">
                                    <ClipboardCheck className="w-3 h-3 mr-1" />
                                    Análise Manual
                                  </Badge>
                                )}
                              </div>
                              {!isManualReview ? (
                                <p className="text-sm text-muted-foreground">
                                  {stat.submitted} de {stat.isApproximate ? "~" : ""}{stat.totalRequired} posts aprovados
                                </p>
                              ) : (
                                <p className="text-xs text-purple-600 dark:text-purple-400">
                                  Este evento não possui metas automáticas
                                </p>
                              )}
                            </div>
                            {!isManualReview && (
                              <Badge variant={stat.percentage >= 100 ? "default" : "secondary"} className="text-lg px-4 py-2">
                                {stat.percentage.toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                          {!isManualReview && <Progress value={stat.percentage} className="h-3" />}
                        </div>
                        {user && !isManualReview && (
                          <GoalProgressBadge eventId={stat.eventId} userId={user.id} variant="detailed" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum evento ativo no momento</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <DashboardSubmissionHistory
              submissions={filteredSubmissionsByEvent}
              events={filteredEvents}
              selectedEvent={selectedHistoryEvent}
              onEventChange={setSelectedHistoryEvent}
              onDeleteSubmission={setSubmissionToDelete}
              SubmissionImageDisplay={SubmissionImageDisplay}
            />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="cadastro" className="space-y-6">
            <DashboardProfile
              profile={profile}
              avatarPreview={avatarPreview}
              avatarFile={avatarFile}
              uploading={uploading}
              uploadProgress={uploadProgress}
              instagram={instagram}
              selectedGender={selectedGender}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              isAgencyAdmin={isAgencyAdmin}
              user={user}
              onAvatarChange={handleAvatarChange}
              onSaveAvatar={async () => { await saveAvatar(); }}
              onInstagramChange={setInstagram}
              onSaveInstagram={async () => { await saveInstagram(instagram); }}
              onGenderChange={setSelectedGender}
              onSaveGender={async () => { await updateProfile({ gender: selectedGender }); }}
              onNewPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onChangePassword={handleChangePassword}
              onFollowersRangeChange={async (value) => { await updateProfile({ followers_range: value }); }}
              onFullNameChange={async (newName) => { await updateProfile({ full_name: newName }); }}
            />
            <PushNotificationSettings />
            <NotificationPreferences />
          </TabsContent>
        </Tabs>

        {/* WhatsApp Button */}
        <DashboardWhatsappButton
          isMasterAdmin={isMasterAdmin}
          isAgencyAdmin={isAgencyAdmin}
          masterWhatsapp={whatsappNumber}
          agencyWhatsapp={agencySupportWhatsapp}
        />

        {/* Tutorial */}
        <Suspense fallback={null}>
          <TutorialGuide />
        </Suspense>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!submissionToDelete} onOpenChange={(open) => !open && setSubmissionToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta submissão? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => submissionToDelete && handleDeleteSubmission(submissionToDelete.id, submissionToDelete.status)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Dashboard;
