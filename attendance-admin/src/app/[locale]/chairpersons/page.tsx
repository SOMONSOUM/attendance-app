"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { AdminShell, EmptyState, TableShell } from "@/components/admin/admin-shell";
import { PaginationFooter } from "@/components/admin/pagination-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  chairpersonSchema,
  type ChairpersonValues,
} from "@/lib/validation";

const PAGE_SIZE = 10;

const emptyChairperson: ChairpersonValues = {
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
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ChairpersonRecord | null>(null);
  const form = useForm<ChairpersonValues>({
    resolver: zodResolver(chairpersonSchema),
    defaultValues: emptyChairperson,
  });
  const chairpersonsQuery = useQuery({
    queryKey: [...chairpersonKeys.all, page],
    queryFn: () => listChairpersons({ page, pageSize: PAGE_SIZE }),
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
    mutationFn: (values: ChairpersonValues) =>
      editing
        ? updateChairperson(editing.id, normalizeChairperson(values))
        : createChairperson(normalizeChairperson(values)),
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
    form.reset(emptyChairperson);
  }

  function startEdit(chairperson: ChairpersonRecord) {
    setEditing(chairperson);
    form.reset({
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
        canCreate ? (
          <Button onClick={resetForm}>
            <Plus size={16} />
            New chairperson
          </Button>
        ) : null
      }
    >
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-3">
          <div>
            <h2 className="text-lg font-semibold">Chairperson catalog</h2>
            <p className="text-sm text-muted-fg">
              {chairpersonsQuery.data?.meta.totalItems ?? 0} saved people
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
                      {canUpdate ? (
                        <Button
                          variant="ghost"
                          className="size-9 px-0"
                          onClick={() => startEdit(chairperson)}
                        >
                          <Edit3 size={15} />
                        </Button>
                      ) : null}
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
            <PaginationFooter
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={chairpersonsQuery.data?.meta.totalItems ?? 0}
              onPageChange={setPage}
            />
          </TableShell>
        </div>

        <Card className="xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)]">
          <CardContent className="max-h-[calc(100dvh-6rem)] overflow-y-auto p-4">
            <Form {...form}>
              <form
                className="grid gap-4"
                onSubmit={form.handleSubmit((values) =>
                  saveMutation.mutate(values),
                )}
              >
                <div>
                  <h2 className="text-lg font-semibold">
                    {editing ? "Update chairperson" : "Create chairperson"}
                  </h2>
                  <p className="text-sm text-muted-fg">
                    Save bilingual names and default organization details.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextField control={form.control} name="honorificTitleEn" label="Honorific EN" />
                  <TextField control={form.control} name="honorificTitleKm" label="Honorific KM" />
                  <TextField control={form.control} name="firstNameEn" label="First name EN" />
                  <TextField control={form.control} name="firstNameKm" label="First name KM" />
                  <TextField control={form.control} name="lastNameEn" label="Last name EN" />
                  <TextField control={form.control} name="lastNameKm" label="Last name KM" />
                </div>
                <TextField control={form.control} name="position" label="Position" />
                <TextField control={form.control} name="organization" label="Organization" />
                <div className="flex gap-2">
                  <Button
                    disabled={
                      saveMutation.isPending ||
                      (editing ? !canUpdate : !canCreate)
                    }
                  >
                    Save chairperson
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Reset
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function TextField({
  control,
  name,
  label,
}: {
  control: ReturnType<typeof useForm<ChairpersonValues>>["control"];
  name: keyof ChairpersonValues;
  label: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} value={field.value ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
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

function normalizeChairperson(form: ChairpersonValues): ChairpersonForm {
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
