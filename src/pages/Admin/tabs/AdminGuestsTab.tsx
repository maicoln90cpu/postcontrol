import { memo, lazy, Suspense } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const GuestManager = lazy(() => 
  import("@/components/GuestManager").then(m => ({ default: m.GuestManager }))
);

interface AdminGuestsTabProps {
  agencyId?: string;
}

export const AdminGuestsTab = memo(({ agencyId }: AdminGuestsTabProps) => {
  return (
    <TabsContent value="guests" className="space-y-6">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <GuestManager agencyId={agencyId} />
      </Suspense>
    </TabsContent>
  );
});

AdminGuestsTab.displayName = "AdminGuestsTab";
