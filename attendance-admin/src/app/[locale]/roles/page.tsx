"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  AdminShell,
  EmptyState,
  SectionToolbar,
  StatusPill,
  TableShell,
} from "@/components/admin/admin-shell";
import { PaginationFooter } from "@/components/admin/pagination-footer";
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
import { useAdminUiStore } from "@/lib/ui-store";
import { roleSchema, type RoleValues } from "@/lib/validation";

const initialRoleForm: RoleValues = {
  name: "",
  description: "",
  permissions: "events:read,attendance:read",
};
const PAGE_SIZE = 10;

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const editing = useAdminUiStore((state) => state.editingRole);
  const setEditing = useAdminUiStore((state) => state.setEditingRole);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialRoleForm,
  });
  const rolesQuery = useQuery({
    queryKey: [...roleKeys.all, page],
    queryFn: () => listRoles({ page, pageSize: PAGE_SIZE }),
  });
  const currentUserQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
  });
  const currentUser = currentUserQuery.data;
  const canCreateRole = hasPermission(currentUser, "roles:create");
  const canUpdateRole = hasPermission(currentUser, "roles:update");
  const canDeleteRole = hasPermission(currentUser, "roles:delete");
  const saveRoleMutation = useMutation({
    mutationFn: (values: RoleValues) => {
      const payload = rolePayload(values);
      return editing ? updateRole(editing.id, payload) : createRole(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      resetForm();
    },
  });
  const deleteRoleMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
  const roles = rolesQuery.data?.items ?? [];

  function rolePayload(values: RoleValues) {
    return {
      name: values.name,
      description: values.description,
      permissions: values.permissions
        .split(",")
        .map((permission) => permission.trim())
        .filter(Boolean),
    };
  }

  function resetForm() {
    setEditing(null);
    reset(initialRoleForm);
  }

  function startEdit(role: RoleRecord) {
    setEditing(role);
    reset({
      name: role.name,
      description: role.description ?? "",
      permissions: role.permissions
        .map(
          ({ permission }) => `${permission.resource}:${permission.action}`,
        )
        .join(", "),
    });
  }

  return (
    <AdminShell
      active="Roles & RBAC"
      title="Roles & permissions"
      description="Roles, members, and permission actions loaded from the database."
      action={
        canCreateRole ? (
          <Button onClick={resetForm}>
            <Plus size={16} />
            New role
          </Button>
        ) : null
      }
    >
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
        <TableShell>
          <SectionToolbar title="RBAC matrix" />
          {rolesQuery.isLoading ? (
            <div className="p-5 text-sm text-muted-fg">Loading roles...</div>
          ) : roles.length ? (
            <>
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
            <PaginationFooter
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={rolesQuery.data?.meta.totalItems ?? 0}
              onPageChange={setPage}
            />
            </>
          ) : (
            <EmptyState
              title="No roles"
              text="Run the seed to create admin, operator, and viewer roles."
            />
          )}
        </TableShell>

        <Card className="overflow-hidden xl:sticky xl:top-20">
            <CardHeader className="border-b border-border bg-muted/30 p-4">
              <CardTitle>{editing ? "Update role" : "Create role"}</CardTitle>
              <p className="mt-1 text-sm text-muted-fg">
                Define the role name and comma-separated permissions.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <form
                className="flex max-h-[calc(100dvh-9rem)] flex-col"
                onSubmit={handleSubmit((values) =>
                  saveRoleMutation.mutate(values),
                )}
              >
                <div className="grid gap-4 overflow-y-auto p-4">
                  <div className="grid gap-2">
                    <Label>Role name</Label>
                    <Input {...register("name")} placeholder="scanner" />
                    {errors.name ? (
                      <p className="text-xs text-destructive">
                        {errors.name.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Input
                      {...register("description")}
                      placeholder="Can scan attendees"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Permissions</Label>
                    <Input
                      {...register("permissions")}
                      placeholder="events:read,attendance:read"
                    />
                    {errors.permissions ? (
                      <p className="text-xs text-destructive">
                        {errors.permissions.message}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-2 border-t border-border bg-card p-4">
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
                </div>
              </form>
            </CardContent>
          </Card>
      </div>
    </AdminShell>
  );
}
