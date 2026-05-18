"use client";

import { useState } from "react";
import { Edit3, Trash2, UserPlus } from "lucide-react";
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
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  assignUserRole,
  createUser,
  deleteUser,
  getCurrentUser,
  hasPermission,
  listRoles,
  listUsers,
  roleKeys,
  type UserForm,
  type UserRecord,
  updateUser,
  userKeys,
} from "@/lib/admin-data";

const initialForm: UserForm = {
  email: "",
  password: "",
  fullNameEn: "",
  gender: undefined,
  position: "",
  department: "",
  roleName: "viewer",
};

export default function PeoplePage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [form, setForm] = useState<UserForm>(initialForm);
  const usersQuery = useQuery({ queryKey: userKeys.all, queryFn: listUsers });
  const currentUserQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
  });
  const currentUser = currentUserQuery.data;
  const canCreate = hasPermission(currentUser, "users:create");
  const canUpdate = hasPermission(currentUser, "users:update");
  const canDelete = hasPermission(currentUser, "users:delete");
  const canReadRoles = hasPermission(currentUser, "roles:read");
  const canAssignRole =
    hasPermission(currentUser, "users:update") &&
    hasPermission(currentUser, "roles:update");
  const rolesQuery = useQuery({
    queryKey: roleKeys.all,
    queryFn: listRoles,
    enabled: canReadRoles,
  });
  const roleOptions = rolesQuery.data?.map((role) => role.name) ?? [
    "viewer",
    "operator",
    "admin",
  ];

  const saveMutation = useMutation({
    mutationFn: () => {
      if (editing) {
        const { password, roleName, ...rest } = form;
        const payload = canAssignRole ? { ...rest, roleName } : rest;
        return updateUser(
          editing.id,
          password ? { ...payload, password } : payload,
        );
      }
      return createUser({ ...form, password: form.password ?? "password123" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleName }: { userId: string; roleName: string }) =>
      assignUserRole(userId, roleName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });

  const users = usersQuery.data ?? [];

  function resetForm() {
    setEditing(null);
    setForm(initialForm);
  }

  function startEdit(user: UserRecord) {
    setEditing(user);
    setForm({
      email: user.email,
      password: "",
      fullNameEn: user.fullNameEn,
      gender: user.gender ?? undefined,
      position: user.position ?? "",
      department: user.department ?? "",
      roleName: user.roles[0]?.role.name ?? "viewer",
    });
  }

  return (
    <AdminShell
      active="People"
      title="People"
      description={`${users.length} users loaded from the database.`}
      action={
        canCreate ? (
          <Button onClick={resetForm}>
            <UserPlus size={16} />
            Add person
          </Button>
        ) : null
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <TableShell>
          <SectionToolbar title="People directory" />
          {usersQuery.isLoading ? (
            <div className="p-5 text-sm text-muted-fg">Loading people...</div>
          ) : users.length ? (
            <Table className="min-w-215">
              <TableHeader>
                <TableRow className="border-t-0">
                  <TableHead>Full name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const role = user.roles[0]?.role.name ?? "viewer";
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.fullNameEn}
                      </TableCell>
                      <TableCell className="text-muted-fg">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-muted-fg">
                        {user.position ?? "-"}
                      </TableCell>
                      <TableCell className="text-muted-fg">
                        {user.department ?? "-"}
                      </TableCell>
                      <TableCell>
                        {canAssignRole && roleOptions.length ? (
                          <Select
                            value={role}
                            onChange={(event) =>
                              assignRoleMutation.mutate({
                                userId: user.id,
                                roleName: event.target.value,
                              })
                            }
                          >
                            {roleOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <StatusPill
                            tone={role === "admin" ? "purple" : "blue"}
                          >
                            {role}
                          </StatusPill>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {canUpdate ? (
                            <Button
                              variant="outline"
                              className="h-8 px-3"
                              onClick={() => startEdit(user)}
                            >
                              <Edit3 size={14} />
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              variant="outline"
                              className="h-8 px-3"
                              onClick={() => deleteMutation.mutate(user.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No people yet"
              text="Add users here and they will be able to log in."
            />
          )}
        </TableShell>

        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Update person" : "Create person"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveMutation.mutate();
              }}
            >
              <Field
                label="Full name"
                value={form.fullNameEn}
                onChange={(value) => setForm({ ...form, fullNameEn: value })}
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) => setForm({ ...form, email: value })}
              />
              <Field
                label={editing ? "New password" : "Password"}
                type="password"
                required={!editing}
                value={form.password ?? ""}
                onChange={(value) => setForm({ ...form, password: value })}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SelectField
                  label="Gender"
                  value={form.gender ?? ""}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      gender: value ? (value as UserForm["gender"]) : undefined,
                    })
                  }
                  options={["", "MALE", "FEMALE", "OTHER"]}
                />
                {!editing || canAssignRole ? (
                  <SelectField
                    label="Role"
                    value={form.roleName ?? "viewer"}
                    onChange={(value) => setForm({ ...form, roleName: value })}
                    options={roleOptions}
                  />
                ) : null}
              </div>
              <Field
                label="Position"
                required={false}
                value={form.position ?? ""}
                onChange={(value) => setForm({ ...form, position: value })}
              />
              <Field
                label="Department"
                required={false}
                value={form.department ?? ""}
                onChange={(value) => setForm({ ...form, department: value })}
              />
              <Button
                disabled={
                  saveMutation.isPending || (editing ? !canUpdate : !canCreate)
                }
              >
                <UserPlus size={16} />
                {editing ? "Update person" : "Create person"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option || "Not set"}
          </option>
        ))}
      </Select>
    </div>
  );
}
