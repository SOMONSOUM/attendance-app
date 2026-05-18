import { Plus, ShieldCheck } from "lucide-react";
import {
  AdminShell,
  SectionToolbar,
  StatusPill,
  TableShell,
} from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const permissions = [
  ["Admin", "users:manage, events:manage, attendance:read", "12 users"],
  [
    "Event manager",
    "events:create, registrations:manage, attendance:read",
    "8 users",
  ],
  ["Scanner staff", "attendance:create, events:read", "26 users"],
  ["Viewer", "events:read, attendance:read", "14 users"],
];

export default function RolesPage() {
  return (
    <AdminShell
      active="Roles & RBAC"
      title="Roles & permissions"
      description="Control access with roles, permission actions, and protected resources."
      action={
        <Button>
          <Plus size={16} />
          New role
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <TableShell>
          <SectionToolbar title="RBAC matrix" />
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs text-muted-fg">
              <tr>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Permissions</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((row) => (
                <tr key={row[0]} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{row[0]}</td>
                  <td className="px-4 py-3 text-muted-fg">{row[1]}</td>
                  <td className="px-4 py-3 text-muted-fg">{row[2]}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone="green">Active</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>

        <Card>
          <CardHeader>
            <CardTitle>Protected resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "users",
              "events",
              "registrations",
              "attendance",
              "theme",
              "roles",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-md border border-border bg-background p-3"
              >
                <ShieldCheck size={16} className="text-primary" />
                <span className="font-medium">{item}</span>
                <span className="ml-auto text-xs text-muted-fg">
                  create/read/update/delete
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
