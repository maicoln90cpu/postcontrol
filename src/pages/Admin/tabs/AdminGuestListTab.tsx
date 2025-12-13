/**
 * AdminGuestListTab - Fase 2 da Refatoração
 * Extrai a tab de Guest List do Admin.tsx
 */

import { memo, Suspense, lazy } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsContent } from "@/components/ui/tabs";

const GuestListManager = lazy(() => import("@/components/GuestListManager").then(m => ({
  default: m.default
})));

export interface AdminGuestListTabProps {
  // Props vazias por enquanto - o GuestListManager busca dados internamente
}

export const AdminGuestListTab = memo(({}: AdminGuestListTabProps) => {
  return (
    <TabsContent value="guest-lists" className="space-y-6">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <GuestListManager />
      </Suspense>
    </TabsContent>
  );
});

AdminGuestListTab.displayName = "AdminGuestListTab";
