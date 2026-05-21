"use client";

import { useState } from "react";
import { OwnerAssignment } from "@/features/tenants/owner-assignment";
import type { Tenant } from "@/features/tenants/types";
import { useTenants } from "@/features/tenants/use-tenants";
import { api } from "@/lib/api";

export default function OwnersPage() {
  const { tenants, loading, error, loadTenants } = useTenants();
  const [message, setMessage] = useState("");
  const [assignError, setAssignError] = useState("");

  async function assignOwner(tenantId: string, userId: string) {
    setAssignError("");
    await api<Tenant>(`/tenants/${tenantId}/owner`, {
      method: "PATCH",
      body: JSON.stringify({ userId }),
    });
    setMessage("Tenant owner updated.");
    await loadTenants();
  }

  return (
    <>
      {message ? (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-fg">
          {message}
        </p>
      ) : null}
      {error || assignError ? (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-sm text-red-600">
          {error || assignError}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-muted-fg">Loading owners...</p> : null}
      <OwnerAssignment
        tenants={tenants}
        onAssign={(tenantId, userId) =>
          assignOwner(tenantId, userId).catch((err: Error) =>
            setAssignError(err.message),
          )
        }
      />
    </>
  );
}
