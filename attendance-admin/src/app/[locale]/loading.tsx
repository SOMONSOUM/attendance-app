import { PageSkeleton, TableSkeleton } from "@/components/admin/loading-skeletons";
import { AdminShell, TableShell } from "@/components/admin/admin-shell";

export default function Loading() {
  return (
    <AdminShell active="" title="" description="">
      <PageSkeleton />
      <div className="mt-5">
        <TableShell>
          <TableSkeleton columns={7} rows={6} />
        </TableShell>
      </div>
    </AdminShell>
  );
}
