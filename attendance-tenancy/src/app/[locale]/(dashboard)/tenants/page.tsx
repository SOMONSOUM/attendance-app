"use client";

import { TenantTable } from "@/features/tenants/tenant-table";
import { useTenants } from "@/features/tenants/use-tenants";

export default function TenantsPage() {
  const { tenants, loading, error, loadTenants } = useTenants();

  return (
    <>
      {error ? (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-muted-fg">Loading tenants...</p> : null}
      <TenantTable tenants={tenants} onRefresh={() => void loadTenants()} />
    </>
  );
}
