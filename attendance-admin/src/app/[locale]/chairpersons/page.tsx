"use client";

import { useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell, EmptyState, TableShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  chairpersonKeys,
  createChairperson,
  deleteChairperson,
  getCurrentUser,
  hasPermission,
  listChairpersons,
  type ChairpersonForm,
  type ChairpersonRecord,
  updateChairperson,
} from "@/lib/admin-data";

const emptyChairperson: ChairpersonForm = {
  honorificTitleEn: "",
  honorificTitleKm: "",
  firstNameEn: "",
  firstNameKm: "",
  lastNameEn: "",
  lastNameKm: "",
  position: "",
  organization: "",
};

export default function ChairpersonsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ChairpersonRecord | null>(null);
  const [form, setForm] = useState<ChairpersonForm>(emptyChairperson);
  const chairpersonsQuery = useQuery({
    queryKey: chairpersonKeys.all,
    queryFn: () => listChairpersons({ pageSize: 100 }),
  });
  const currentUserQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
  });
  const canCreate = hasPermission(currentUserQuery.data, "chairpersons:create");
  const canUpdate = hasPermission(currentUserQuery.data, "chairpersons:update");
  const canDelete = hasPermission(currentUserQuery.data, "chairpersons:delete");
  const chairpersons = chairpersonsQuery.data?.items ?? [];
  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? updateChairperson(editing.id, normalizeChairperson(form))
        : createChairperson(normalizeChairperson(form)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chairpersonKeys.all });
      resetForm();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteChairperson,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chairpersonKeys.all });
    },
  });

  function resetForm() {
    setEditing(null);
    setForm(emptyChairperson);
  }

  function startEdit(chairperson: ChairpersonRecord) {
    setEditing(chairperson);
    setForm({
      honorificTitleEn: chairperson.honorificTitleEn,
      honorificTitleKm: chairperson.honorificTitleKm,
      firstNameEn: chairperson.firstNameEn,
      firstNameKm: chairperson.firstNameKm,
      lastNameEn: chairperson.lastNameEn,
      lastNameKm: chairperson.lastNameKm,
      position: chairperson.position ?? "",
      organization: chairperson.organization ?? "",
    });
  }

  return (
    <AdminShell
      active="Chairpersons"
      title="Chairpersons"
      description="Reusable chairpersons for meeting setup."
      action={
        <Button onClick={resetForm}>
          <Plus size={16} />
          New chairperson
        </Button>
      }
    >
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-3">
          <div>
            <h2 className="text-lg font-semibold">Chairperson catalog</h2>
            <p className="text-sm text-muted-fg">
              {chairpersons.length} saved people
            </p>
          </div>
        <TableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chairpersons.map((chairperson) => (
                <TableRow key={chairperson.id}>
                  <TableCell className="font-medium">
                    {formatChairperson(chairperson)}
                  </TableCell>
                  <TableCell className="text-muted-fg">
                    {chairperson.position || "Not set"}
                  </TableCell>
                  <TableCell className="text-muted-fg">
                    {chairperson.organization || "Not set"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" className="size-9 px-0" onClick={() => startEdit(chairperson)}>
                      <Edit3 size={15} />
                    </Button>
                    {canDelete ? (
                      <Button
                        variant="ghost"
                        className="size-9 px-0 text-danger"
                        onClick={() => deleteMutation.mutate(chairperson.id)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!chairpersons.length ? (
            <EmptyState
              title="No chairpersons yet"
              text="Create chairpersons once and select them while creating meetings."
            />
          ) : null}
        </TableShell>
        </div>

        <Card className="xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)]">
          <CardContent className="grid max-h-[calc(100dvh-6rem)] gap-4 overflow-y-auto p-4">
            <div>
              <h2 className="text-lg font-semibold">
                {editing ? "Update chairperson" : "Create chairperson"}
              </h2>
              <p className="text-sm text-muted-fg">
                Save bilingual names and default organization details.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Honorific EN" value={form.honorificTitleEn} onChange={(honorificTitleEn) => setForm({ ...form, honorificTitleEn })} />
              <Field label="Honorific KM" value={form.honorificTitleKm} onChange={(honorificTitleKm) => setForm({ ...form, honorificTitleKm })} />
              <Field label="First name EN" value={form.firstNameEn} onChange={(firstNameEn) => setForm({ ...form, firstNameEn })} />
              <Field label="First name KM" value={form.firstNameKm} onChange={(firstNameKm) => setForm({ ...form, firstNameKm })} />
              <Field label="Last name EN" value={form.lastNameEn} onChange={(lastNameEn) => setForm({ ...form, lastNameEn })} />
              <Field label="Last name KM" value={form.lastNameKm} onChange={(lastNameKm) => setForm({ ...form, lastNameKm })} />
            </div>
            <Field label="Position" value={form.position ?? ""} required={false} onChange={(position) => setForm({ ...form, position })} />
            <Field label="Organization" value={form.organization ?? ""} required={false} onChange={(organization) => setForm({ ...form, organization })} />
            <div className="flex gap-2">
              <Button
                disabled={saveMutation.isPending || (editing ? !canUpdate : !canCreate)}
                onClick={() => saveMutation.mutate()}
              >
                Save chairperson
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
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
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function formatChairperson(chairperson: ChairpersonForm) {
  return [
    chairperson.honorificTitleEn,
    chairperson.firstNameEn,
    chairperson.lastNameEn,
  ]
    .filter(Boolean)
    .join(" ");
}

function normalizeChairperson(form: ChairpersonForm): ChairpersonForm {
  return {
    honorificTitleEn: form.honorificTitleEn.trim(),
    honorificTitleKm: form.honorificTitleKm.trim(),
    firstNameEn: form.firstNameEn.trim(),
    firstNameKm: form.firstNameKm.trim(),
    lastNameEn: form.lastNameEn.trim(),
    lastNameKm: form.lastNameKm.trim(),
    position: form.position?.trim() || null,
    organization: form.organization?.trim() || null,
  };
}
