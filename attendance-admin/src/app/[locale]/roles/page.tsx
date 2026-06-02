"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  Edit3,
  MapPin,
  Palette,
  Plus,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

const PAGE_SIZE = 10;
const actionColumns = ["read", "create", "update", "delete"] as const;

const permissionGroups = [
  {
    resource: "events",
    label: "Events",
    description: "Create and manage public attendance events.",
    icon: CalendarDays,
    actions: ["read", "create", "update", "delete"],
  },
  {
    resource: "meetings",
    label: "Meetings",
    description: "Create meetings, chairpersons, participants, and QR codes.",
    icon: Users,
    actions: ["read", "create", "update", "delete"],
  },
  {
    resource: "attendance",
    label: "Attendance",
    description: "View rosters and perform check-in operations.",
    icon: ClipboardCheck,
    actions: ["read", "create", "update", "delete"],
  },
  {
    resource: "places",
    label: "Places",
    description: "Maintain reusable places and location rules.",
    icon: MapPin,
    actions: ["read", "create", "update", "delete"],
  },
  {
    resource: "chairpersons",
    label: "Chairpersons",
    description: "Maintain reusable meeting chairperson profiles.",
    icon: UserCog,
    actions: ["read", "create", "update", "delete"],
  },
  {
    resource: "registrations",
    label: "Registration imports",
    description: "Upload spreadsheets and reuse attendee lists.",
    icon: ClipboardCheck,
    actions: ["read", "create", "delete"],
  },
  {
    resource: "users",
    label: "People",
    description: "Manage admin users and their assigned roles.",
    icon: Users,
    actions: ["read", "create", "update", "delete"],
  },
  {
    resource: "roles",
    label: "Roles",
    description: "Create roles and choose what each role can do.",
    icon: ShieldCheck,
    actions: ["read", "create", "update", "delete"],
  },
  {
    resource: "theme",
    label: "Theme",
    description: "Change participant-facing branding.",
    icon: Palette,
    actions: ["update"],
  },
] as const;

const roleTemplates = [
  {
    label: "Scanner",
    permissions: ["events:read", "meetings:read", "attendance:read", "attendance:create"],
  },
  {
    label: "Organizer",
    permissions: [
      "events:read",
      "events:create",
      "events:update",
      "meetings:read",
      "meetings:create",
      "meetings:update",
      "attendance:read",
      "registrations:read",
      "registrations:create",
      "places:read",
      "chairpersons:read",
    ],
  },
  {
    label: "Admin",
    permissions: permissionGroups.flatMap((group) =>
      group.actions.map((action) => `${group.resource}:${action}`),
    ),
  },
];

const initialRoleForm: RoleValues = {
  name: "",
  description: "",
  permissions: ["events:read", "attendance:read"],
};

export default function RolesPage() {
  const t = useTranslations("roles");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const editing = useAdminUiStore((state) => state.editingRole);
  const setEditing = useAdminUiStore((state) => state.setEditingRole);
  const form = useForm<RoleValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialRoleForm,
  });
  const selectedPermissions = form.watch("permissions") ?? [];
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
      name: values.name.trim(),
      description: values.description?.trim() || "",
      permissions: values.permissions,
    };
  }

  function resetForm() {
    setEditing(null);
    form.reset(initialRoleForm);
  }

  function startEdit(role: RoleRecord) {
    setEditing(role);
    form.reset({
      name: role.name,
      description: role.description ?? "",
      permissions: role.permissions.map(
        ({ permission }) => `${permission.resource}:${permission.action}`,
      ),
    });
  }

  function setPermissions(permissions: string[]) {
    form.setValue("permissions", Array.from(new Set(permissions)), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function togglePermission(permission: string, checked: boolean) {
    setPermissions(
      checked
        ? [...selectedPermissions, permission]
        : selectedPermissions.filter((item) => item !== permission),
    );
  }

  function toggleGroup(resource: string, checked: boolean) {
    const group = permissionGroups.find((item) => item.resource === resource);
    if (!group) return;
    const groupPermissions = group.actions.map(
      (action) => `${group.resource}:${action}`,
    );
    setPermissions(
      checked
        ? [...selectedPermissions, ...groupPermissions]
        : selectedPermissions.filter((item) => !groupPermissions.includes(item)),
    );
  }

  function toggleAction(action: string, checked: boolean) {
    const actionPermissions = permissionGroups
      .filter((group) => groupHasAction(group, action))
      .map((group) => `${group.resource}:${action}`);
    setPermissions(
      checked
        ? [...selectedPermissions, ...actionPermissions]
        : selectedPermissions.filter(
            (permission) => !actionPermissions.includes(permission),
          ),
    );
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
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_520px]">
        <TableShell>
          <SectionToolbar title="Roles people can use" />
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
              Choose plain-language access below. The app will save the technical permission codes.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Form {...form}>
              <form
                className="flex max-h-[calc(100dvh-9rem)] flex-col"
                onSubmit={form.handleSubmit((values) =>
                  saveRoleMutation.mutate(values),
                )}
              >
                <div className="grid gap-4 overflow-y-auto p-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("roleName")}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="scanner" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("roleDescription")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("descriptionPlaceholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">Permission presets</p>
                      <span className="text-xs text-muted-fg">
                        {selectedPermissions.length} selected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {roleTemplates.map((template) => (
                        <Button
                          key={template.label}
                          type="button"
                          variant="outline"
                          className="h-8"
                          onClick={() => setPermissions(template.permissions)}
                        >
                          {template.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="overflow-x-auto rounded-md border border-border">
                      <div className="min-w-[30rem]">
                        <div className="grid grid-cols-[minmax(11rem,1fr)_repeat(4,minmax(4.75rem,5.5rem))] border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold uppercase text-muted-fg">
                          <span>Access area</span>
                          {actionColumns.map((action) => {
                            const actionPermissions = permissionGroups
                              .filter((group) => groupHasAction(group, action))
                              .map((group) => `${group.resource}:${action}`);
                            const allSelected = actionPermissions.every(
                              (permission) =>
                                selectedPermissions.includes(permission),
                            );
                            return (
                              <label
                                key={action}
                                className="flex cursor-pointer items-center justify-center gap-1.5 capitalize"
                              >
                                <Checkbox
                                  checked={allSelected}
                                  onCheckedChange={(checked) =>
                                    toggleAction(action, checked === true)
                                  }
                                  aria-label={`Select all ${action} permissions`}
                                />
                                {action}
                              </label>
                            );
                          })}
                        </div>
                        <div className="divide-y divide-border">
                          {permissionGroups.map((group) => {
                            const Icon = group.icon;
                            const groupPermissions = group.actions.map(
                              (action) => `${group.resource}:${action}`,
                            );
                            const allSelected = groupPermissions.every(
                              (permission) =>
                                selectedPermissions.includes(permission),
                            );
                            return (
                              <section
                                key={group.resource}
                                className="grid grid-cols-[minmax(11rem,1fr)_repeat(4,minmax(4.75rem,5.5rem))] items-stretch bg-background"
                              >
                                <div className="flex min-w-0 items-start gap-3 p-3">
                                  <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border text-muted-fg">
                                    <Icon size={16} />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{group.label}</p>
                                      <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-fg">
                                        <Checkbox
                                          checked={allSelected}
                                          onCheckedChange={(checked) =>
                                            toggleGroup(
                                              group.resource,
                                              checked === true,
                                            )
                                          }
                                          aria-label={`Select all ${group.label} permissions`}
                                        />
                                        All
                                      </label>
                                    </div>
                                    <p className="mt-1 text-xs leading-5 text-muted-fg">
                                      {group.description}
                                    </p>
                                  </div>
                                </div>
                                {actionColumns.map((action) => {
                                  const permission = `${group.resource}:${action}`;
                                  const available = groupHasAction(group, action);
                                  return (
                                    <div
                                      key={permission}
                                      className="grid place-items-center border-l border-border px-2"
                                    >
                                      {available ? (
                                        <Checkbox
                                          checked={selectedPermissions.includes(
                                            permission,
                                          )}
                                          onCheckedChange={(checked) =>
                                            togglePermission(
                                              permission,
                                              checked === true,
                                            )
                                          }
                                          aria-label={`${group.label} ${action}`}
                                        />
                                      ) : (
                                        <span className="h-px w-4 bg-border" />
                                      )}
                                    </div>
                                  );
                                })}
                              </section>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    {form.formState.errors.permissions ? (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.permissions.message}
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
          Access areas
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
      {entries.map(([resource, actions]) => {
        const group = permissionGroups.find((item) => item.resource === resource);
        return (
          <span
            key={resource}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
          >
            <span className="font-medium text-foreground">
              {group?.label ?? resource}
            </span>
            <span className="text-muted-fg">
              {actions.sort().map(capitalize).join(", ")}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function groupHasAction(
  group: (typeof permissionGroups)[number],
  action: string,
) {
  return group.actions.some((item) => item === action);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
