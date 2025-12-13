import { memo, lazy, Suspense } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const GuestAuditLog = lazy(() => 
  import("@/components/GuestAuditLog").then(m => ({ default: m.GuestAuditLog }))
);

interface AdminAuditTabProps {
  agencyId?: string;
}

export const AdminAuditTab = memo(({ agencyId }: AdminAuditTabProps) => {
  return (
    <TabsContent value="audit" className="space-y-6">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <GuestAuditLog agencyId={agencyId} />
      </Suspense>
    </TabsContent>
  );
});

AdminAuditTab.displayName = "AdminAuditTab";
