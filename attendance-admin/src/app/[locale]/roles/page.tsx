"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
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
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const t = useTranslations("roles");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const editing = useAdminUiStore((state) => state.editingRole);
  const setEditing = useAdminUiStore((state) => state.setEditingRole);
  const formMethods = useForm<RoleValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialRoleForm,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = formMethods;
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
      title={t("title")}
      description={t("description")}
      action={
        canCreateRole ? (
          <Button onClick={resetForm}>
            <Plus size={16} />
            {t("newRole")}
          </Button>
        ) : null
      }
    >
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
        <TableShell>
          <SectionToolbar title={t("matrix")} />
          {rolesQuery.isLoading ? (
            <div className="p-5 text-sm text-muted-fg">{t("loading")}</div>
          ) : roles.length ? (
            <>
              <div className="grid gap-3 p-4">
                {roles.map((role) => (
                  <RoleMatrixCard
                    key={role.id}
                    role={role}
                    canUpdateRole={canUpdateRole}
                    canDeleteRole={canDeleteRole}
                    onEdit={() => startEdit(role)}
                    onDelete={() => deleteRoleMutation.mutate(role.id)}
                    t={t}
                  />
                ))}
              </div>
              <PaginationFooter
                page={page}
                pageSize={PAGE_SIZE}
                totalItems={rolesQuery.data?.meta.totalItems ?? 0}
                onPageChange={setPage}
              />
            </>
          ) : (
            <EmptyState title={t("emptyTitle")} text={t("emptyText")} />
          )}
        </TableShell>

        <Card className="overflow-hidden xl:sticky xl:top-20">
          <CardHeader className="border-b border-border bg-muted/30 p-4">
            <CardTitle>
              {editing ? t("updateRole") : t("createRole")}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-fg">
              {t("formDescription")}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Form {...formMethods}>
              <form
                className="flex max-h-[calc(100dvh-9rem)] flex-col"
                onSubmit={handleSubmit((values) =>
                  saveRoleMutation.mutate(values),
                )}
              >
                <div className="grid gap-4 overflow-y-auto p-4">
                  <div className="grid gap-2">
                    <Label>{t("roleName")}</Label>
                    <Input {...register("name")} placeholder="scanner" />
                    {errors.name ? (
                      <p className="text-xs text-destructive">
                        {errors.name.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("roleDescription")}</Label>
                    <Input
                      {...register("description")}
                      placeholder={t("descriptionPlaceholder")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("permissions")}</Label>
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
                    {editing ? t("updateRole") : t("createRole")}
                  </Button>
                  {editing ? (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      {t("cancel")}
                    </Button>
                  ) : null}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function RoleMatrixCard({
  role,
  canUpdateRole,
  canDeleteRole,
  onEdit,
  onDelete,
  t,
}: {
  role: RoleRecord;
  canUpdateRole: boolean;
  canDeleteRole: boolean;
  onEdit: () => void;
  onDelete: () => void;
  t: ReturnType<typeof useTranslations<"roles">>;
}) {
  return (
    <article className="rounded-md border border-border bg-background p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold capitalize">{role.name}</h3>
            <StatusPill tone="green">{t("active")}</StatusPill>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">
            {role.description || t("noDescription")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-fg">
            {t("memberCount", { count: role._count.users })}
          </span>
          {canUpdateRole ? (
            <Button
              variant="outline"
              className="size-8 px-0"
              aria-label={t("editRole")}
              onClick={onEdit}
            >
              <Edit3 size={14} />
            </Button>
          ) : null}
          {canDeleteRole ? (
            <Button
              variant="outline"
              className="size-8 px-0"
              aria-label={t("deleteRole")}
              disabled={role._count.users > 0}
              onClick={onDelete}
            >
              <Trash2 size={14} />
            </Button>
          ) : null}
        </div>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase text-muted-fg">
          {t("permissions")}
        </p>
        <PermissionChips role={role} />
      </div>
    </article>
  );
}

function PermissionChips({ role }: { role: RoleRecord }) {
  const grouped = role.permissions.reduce<Record<string, string[]>>(
    (result, { permission }) => {
      result[permission.resource] = [
        ...(result[permission.resource] ?? []),
        permission.action,
      ];
      return result;
    },
    {},
  );
  const entries = Object.entries(grouped);

  return (
    <div className="flex max-w-3xl flex-wrap gap-1.5">
      {entries.map(([resource, actions]) => (
        <span
          key={resource}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
        >
          <span className="font-medium text-foreground">{resource}</span>
          <span className="text-muted-fg">{actions.sort().join(", ")}</span>
        </span>
      ))}
    </div>
  );
}
