"use client";

import { useState } from "react";
import { Edit3, ShieldCheck, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AdminShell,
  EmptyState,
  SectionToolbar,
  StatusPill,
  TableShell,
} from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createRole,
  deleteRole,
  getCurrentUser,
  hasPermission,
  listRoles,
  roleKeys,
  type RoleRecord,
  updateRole,
} from "@/lib/admin-data";
export default function RolesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<RoleRecord | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState("events:read,attendance:read");
  const rolesQuery = useQuery({ queryKey: roleKeys.all, queryFn: listRoles });
  const currentUserQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
  });
  const currentUser = currentUserQuery.data;
  const canCreateRole = hasPermission(currentUser, "roles:create");
  const canUpdateRole = hasPermission(currentUser, "roles:update");
  const canDeleteRole = hasPermission(currentUser, "roles:delete");
  const saveRoleMutation = useMutation({
    mutationFn: () =>
      editing ? updateRole(editing.id, rolePayload()) : createRole(rolePayload()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      resetForm();
    },
  });
  const deleteRoleMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
  const roles = rolesQuery.data ?? [];
  const resources = Array.from(
    new Set(
      roles.flatMap((role) =>
        role.permissions.map(({ permission }) => permission.resource),
      ),
    ),
  ).sort();

  function rolePayload() {
    return {
      name,
      description,
      permissions: permissions
        .split(",")
        .map((permission) => permission.trim())
        .filter(Boolean),
    };
  }

  function resetForm() {
    setEditing(null);
    setName("");
    setDescription("");
    setPermissions("events:read,attendance:read");
  }

  function startEdit(role: RoleRecord) {
    setEditing(role);
    setName(role.name);
    setDescription(role.description ?? "");
    setPermissions(
      role.permissions
        .map(
          ({ permission }) => `${permission.resource}:${permission.action}`,
        )
        .join(", "),
    );
  }

  return (
    <AdminShell
      active="Roles & RBAC"
      title="Roles & permissions"
      description="Roles, members, and permission actions loaded from the database."
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <TableShell>
          <SectionToolbar title="RBAC matrix" />
          {rolesQuery.isLoading ? (
            <div className="p-5 text-sm text-muted-fg">Loading roles...</div>
          ) : roles.length ? (
            <Table className="min-w-190">
              <TableHeader>
                <TableRow className="border-t-0">
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="text-muted-fg">
                      {role.permissions
                        .map(
                          ({ permission }) =>
                            `${permission.resource}:${permission.action}`,
                        )
                        .join(", ")}
                    </TableCell>
                    <TableCell className="text-muted-fg">
                      {role._count.users} users
                    </TableCell>
                    <TableCell>
                      <StatusPill tone="green">Active</StatusPill>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {canUpdateRole ? (
                          <Button
                            variant="outline"
                            className="h-8 px-3"
                            onClick={() => startEdit(role)}
                          >
                            <Edit3 size={14} />
                          </Button>
                        ) : null}
                        {canDeleteRole ? (
                          <Button
                            variant="outline"
                            className="h-8 px-3"
                            disabled={role._count.users > 0}
                            onClick={() => deleteRoleMutation.mutate(role.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No roles"
              text="Run the seed to create admin, operator, and viewer roles."
            />
          )}
        </TableShell>

        <Card>
          <CardHeader>
            <CardTitle>Protected resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resources.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-md border border-border bg-background p-3"
              >
                <ShieldCheck size={16} className="text-primary" />
                <span className="font-medium">{item}</span>
                <span className="ml-auto text-xs text-muted-fg">protected</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Update role" : "Create role"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveRoleMutation.mutate();
              }}
            >
              <div className="grid gap-2">
                <Label>Role name</Label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="scanner"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Can scan attendees"
                />
              </div>
              <div className="grid gap-2">
                <Label>Permissions</Label>
                <Input
                  value={permissions}
                  onChange={(event) => setPermissions(event.target.value)}
                  placeholder="events:read,attendance:read"
                  required
                />
              </div>
              <Button
                disabled={
                  saveRoleMutation.isPending ||
                  (editing ? !canUpdateRole : !canCreateRole)
                }
              >
                {editing ? "Update role" : "Create role"}
              </Button>
              {editing ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
