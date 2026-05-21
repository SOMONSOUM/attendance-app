import { StatCard } from "@/components/tenancy/stat-card";
import { TenantTable } from "./tenant-table";
import type { Tenant } from "./types";

export function Overview({ tenants }: { tenants: Tenant[] }) {
  const totalUsers = tenants.reduce(
    (sum, tenant) => sum + (tenant._count?.users ?? 0),
    0,
  );
  const totalEvents = tenants.reduce(
    (sum, tenant) => sum + (tenant._count?.events ?? 0),
    0,
  );
  const activeTenants = tenants.filter(
    (tenant) => tenant.status === "ACTIVE",
  ).length;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Active tenants" value={String(activeTenants)} />
        <StatCard label="Users" value={String(totalUsers)} />
        <StatCard label="Events" value={String(totalEvents)} />
      </div>
      <TenantTable tenants={tenants.slice(0, 5)} />
    </>
  );
}
