import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { Tenant } from "./types";

export function OwnerAssignment({
  tenants,
  onAssign,
}: {
  tenants: Tenant[];
  onAssign: (tenantId: string, userId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign tenant owner</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {tenants.map((tenant) => (
          <div
            key={tenant.id}
            className="grid gap-3 rounded-md border border-border bg-background p-3 md:grid-cols-[1fr_280px_auto] md:items-end"
          >
            <div>
              <p className="font-medium">{tenant.name}</p>
              <p className="text-sm text-muted-fg">
                Current owner: {tenant.ownerUser?.email ?? "No owner"}
              </p>
            </div>
            <Select
              defaultValue={tenant.ownerUser?.id ?? ""}
              onChange={(event) => {
                if (event.target.value) onAssign(tenant.id, event.target.value);
              }}
            >
              <option value="">Select user</option>
              {(tenant.users ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullNameEn} ({user.email})
                </option>
              ))}
            </Select>
            <span className="text-xs text-muted-fg">
              {(tenant.users ?? []).length} users
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
