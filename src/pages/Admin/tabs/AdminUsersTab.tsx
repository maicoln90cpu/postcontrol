import { memo, lazy, Suspense } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const MemoizedUserManagement = lazy(() => 
  import("@/components/memoized/MemoizedUserManagement").then(m => ({ default: m.MemoizedUserManagement }))
);

interface AdminUsersTabProps {
  agencyId?: string;
}

export const AdminUsersTab = memo(({ agencyId }: AdminUsersTabProps) => {
  return (
    <TabsContent value="users" className="space-y-6">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <MemoizedUserManagement />
      </Suspense>
    </TabsContent>
  );
});

AdminUsersTab.displayName = "AdminUsersTab";
