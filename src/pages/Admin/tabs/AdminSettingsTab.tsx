/**
 * AdminSettingsTab - Fase 2 da Refatoração
 * Extrai a tab de Configurações do Admin.tsx
 */

import { memo, Suspense, lazy } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsContent } from "@/components/ui/tabs";

const MemoizedAdminSettings = lazy(() => import("@/components/memoized/MemoizedAdminSettings").then(m => ({
  default: m.MemoizedAdminSettings
})));

const AgencyAdminSettings = lazy(() => import("@/components/AgencyAdminSettings").then(m => ({
  default: m.AgencyAdminSettings
})));

const GoalNotificationSettings = lazy(() => import("@/components/GoalNotificationSettings").then(m => ({
  default: m.GoalNotificationSettings
})));

export interface AdminSettingsTabProps {
  isMasterAdmin: boolean;
  currentAgencyId?: string;
}

export const AdminSettingsTab = memo(({
  isMasterAdmin,
  currentAgencyId
}: AdminSettingsTabProps) => {
  return (
    <TabsContent value="settings" className="space-y-6">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        {isMasterAdmin ? (
          <MemoizedAdminSettings isMasterAdmin={true} />
        ) : (
          <AgencyAdminSettings />
        )}
      </Suspense>

      {/* Goal Notification Settings */}
      {currentAgencyId && (
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <GoalNotificationSettings agencyId={currentAgencyId} />
        </Suspense>
      )}
    </TabsContent>
  );
});

AdminSettingsTab.displayName = "AdminSettingsTab";
