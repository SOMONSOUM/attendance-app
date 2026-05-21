"use client";

import { Overview } from "@/features/tenants/overview";
import { useTenants } from "@/features/tenants/use-tenants";

export default function OverviewPage() {
  const { tenants, loading, error } = useTenants();

  return (
    <>
      {error ? (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="text-sm text-muted-fg">Loading dashboard...</p>
      ) : (
        <Overview tenants={tenants} />
      )}
    </>
  );
}
