"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  AdminShell,
  EmptyState,
  StatusPill,
  TableShell,
} from "@/components/admin/admin-shell";
import { LocationPicker } from "@/components/admin/location-picker";
import { TableSkeleton } from "@/components/admin/loading-skeletons";
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
  createPlace,
  deletePlace,
  getCurrentUser,
  hasPermission,
  listPlaces,
  placeKeys,
  type PlaceForm,
  type PlaceRecord,
  updatePlace,
} from "@/lib/admin-data";
import { placeSchema, type PlaceValues } from "@/lib/validation";

const PAGE_SIZE = 10;

const emptyPlace: PlaceValues = {
  name: "",
  description: "",
  requireLocation: false,
  locationName: "",
  latitude: 11.5564,
  longitude: 104.9282,
  radiusMeters: 100,
};

export default function PlacesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<PlaceRecord | null>(null);
  const form = useForm<PlaceValues>({
    resolver: zodResolver(placeSchema),
    defaultValues: emptyPlace,
  });
  const locationValue = form.watch();
  const placesQuery = useQuery({
    queryKey: [...placeKeys.all, page],
    queryFn: () => listPlaces({ page, pageSize: PAGE_SIZE }),
  });
  const currentUserQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
  });
  const canCreate = hasPermission(currentUserQuery.data, "places:create");
  const canUpdate = hasPermission(currentUserQuery.data, "places:update");
  const canDelete = hasPermission(currentUserQuery.data, "places:delete");
  const places = placesQuery.data?.items ?? [];
  const locationRequiredCount = useMemo(
    () => places.filter((place) => place.requireLocation).length,
    [places],
  );

  const saveMutation = useMutation({
    mutationFn: (values: PlaceValues) =>
      editing
        ? updatePlace(editing.id, normalizePlace(values))
        : createPlace(normalizePlace(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: placeKeys.all });
      resetForm();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deletePlace,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: placeKeys.all });
    },
  });

  function resetForm() {
    setEditing(null);
    form.reset(emptyPlace);
  }

  function startEdit(place: PlaceRecord) {
    setEditing(place);
    form.reset({
      name: place.name,
      description: place.description ?? "",
      requireLocation: Boolean(place.requireLocation),
      locationName: place.locationName ?? place.name,
      latitude: Number(place.latitude ?? emptyPlace.latitude),
      longitude: Number(place.longitude ?? emptyPlace.longitude),
      radiusMeters: place.radiusMeters ?? emptyPlace.radiusMeters,
    });
  }

  return (
    <AdminShell
      active="Places"
      title="Places"
      description="Reusable places for events and meetings."
      action={
        canCreate ? (
          <Button onClick={resetForm}>
            <Plus size={16} />
            New place
          </Button>
        ) : null
      }
    >
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-3">
          <div>
            <h2 className="text-lg font-semibold">Place catalog</h2>
            <p className="text-sm text-muted-fg">
              {placesQuery.data?.meta.totalItems ?? 0} saved places,{" "}
              {locationRequiredCount} on this page require location
            </p>
          </div>
          <TableShell>
            {placesQuery.isLoading ? (
              <TableSkeleton columns={4} />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {places.map((place) => (
                      <TableRow key={place.id}>
                        <TableCell className="font-medium">{place.name}</TableCell>
                        <TableCell className="text-muted-fg">
                          {place.locationName || "Not set"}
                        </TableCell>
                        <TableCell>
                          <StatusPill tone={place.requireLocation ? "green" : "blue"}>
                            {place.requireLocation ? "Required" : "Optional"}
                          </StatusPill>
                        </TableCell>
                        <TableCell className="text-right">
                          {canUpdate ? (
                            <Button
                              variant="ghost"
                              className="size-9 px-0"
                              onClick={() => startEdit(place)}
                            >
                              <Edit3 size={15} />
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              variant="ghost"
                              className="size-9 px-0 text-danger"
                              onClick={() => deleteMutation.mutate(place.id)}
                            >
                              <Trash2 size={15} />
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {!places.length ? (
                  <EmptyState
                    title="No places yet"
                    text="Create places once and reuse them in event and meeting setup."
                  />
                ) : null}
                <PaginationFooter
                  page={page}
                  pageSize={PAGE_SIZE}
                  totalItems={placesQuery.data?.meta.totalItems ?? 0}
                  onPageChange={setPage}
                />
              </>
            )}
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
                    {editing ? "Update place" : "Create place"}
                  </h2>
                  <p className="text-sm text-muted-fg">
                    Set the default location rule used when this place is selected.
                  </p>
                </div>
                <TextField control={form.control} name="name" label="Name" />
                <TextField
                  control={form.control}
                  name="description"
                  label="Description"
                />
                <LocationPicker
                  title="Place location check-in"
                  value={{
                    requireLocation: Boolean(locationValue.requireLocation),
                    locationName: locationValue.locationName ?? "",
                    latitude: Number(locationValue.latitude ?? emptyPlace.latitude),
                    longitude: Number(locationValue.longitude ?? emptyPlace.longitude),
                    radiusMeters: locationValue.radiusMeters,
                  }}
                  onChange={(value) => {
                    form.setValue("requireLocation", value.requireLocation, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    form.setValue("locationName", value.locationName, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    form.setValue("latitude", value.latitude, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    form.setValue("longitude", value.longitude, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    form.setValue("radiusMeters", value.radiusMeters, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
                {form.formState.errors.locationName ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.locationName.message}
                  </p>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    disabled={
                      saveMutation.isPending ||
                      (editing ? !canUpdate : !canCreate)
                    }
                  >
                    Save place
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
  control: ReturnType<typeof useForm<PlaceValues>>["control"];
  name: "name" | "description";
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

function normalizePlace(form: PlaceValues): PlaceForm {
  const requireLocation = Boolean(form.requireLocation);
  const name = form.name.trim();
  return {
    ...form,
    name,
    description: form.description?.trim() || null,
    requireLocation,
    locationName: form.locationName?.trim() || name,
    latitude: requireLocation ? Number(form.latitude ?? 0) : undefined,
    longitude: requireLocation ? Number(form.longitude ?? 0) : undefined,
    radiusMeters: requireLocation ? form.radiusMeters ?? 100 : 0,
  };
}
