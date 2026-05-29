"use client";

import { useMemo, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell, EmptyState, StatusPill, TableShell } from "@/components/admin/admin-shell";
import { LocationPicker } from "@/components/admin/location-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const emptyPlace: PlaceForm = {
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
  const [editing, setEditing] = useState<PlaceRecord | null>(null);
  const [form, setForm] = useState<PlaceForm>(emptyPlace);
  const placesQuery = useQuery({
    queryKey: placeKeys.all,
    queryFn: () => listPlaces({ pageSize: 100 }),
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
    mutationFn: () =>
      editing
        ? updatePlace(editing.id, normalizePlace(form))
        : createPlace(normalizePlace(form)),
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
    setForm(emptyPlace);
  }

  function startEdit(place: PlaceRecord) {
    setEditing(place);
    setForm({
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
        <Button onClick={resetForm}>
          <Plus size={16} />
          New place
        </Button>
      }
    >
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-3">
          <div>
            <h2 className="text-lg font-semibold">Place catalog</h2>
            <p className="text-sm text-muted-fg">
              {places.length} saved places, {locationRequiredCount} require location
            </p>
          </div>
        <TableShell>
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
                    <Button variant="ghost" className="size-9 px-0" onClick={() => startEdit(place)}>
                      <Edit3 size={15} />
                    </Button>
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
        </TableShell>
        </div>

        <Card className="xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)]">
          <CardContent className="grid max-h-[calc(100dvh-6rem)] gap-4 overflow-y-auto p-4">
            <div>
              <h2 className="text-lg font-semibold">
                {editing ? "Update place" : "Create place"}
              </h2>
              <p className="text-sm text-muted-fg">
                Set the default location rule used when this place is selected.
              </p>
            </div>
            <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
            <Field
              label="Description"
              value={form.description ?? ""}
              required={false}
              onChange={(description) => setForm({ ...form, description })}
            />
            <LocationPicker
              title="Place location check-in"
              value={{
                requireLocation: form.requireLocation,
                locationName: form.locationName ?? "",
                latitude: Number(form.latitude ?? emptyPlace.latitude),
                longitude: Number(form.longitude ?? emptyPlace.longitude),
                radiusMeters: form.radiusMeters,
              }}
              onChange={(value) => setForm({ ...form, ...value })}
            />
            <div className="flex gap-2">
              <Button
                disabled={saveMutation.isPending || (editing ? !canUpdate : !canCreate)}
                onClick={() => saveMutation.mutate()}
              >
                Save place
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

function normalizePlace(form: PlaceForm): PlaceForm {
  const requireLocation = Boolean(form.requireLocation);
  return {
    ...form,
    name: form.name.trim(),
    description: form.description?.trim() || null,
    requireLocation,
    locationName: form.locationName?.trim() || form.name.trim(),
    latitude: requireLocation ? Number(form.latitude ?? 0) : undefined,
    longitude: requireLocation ? Number(form.longitude ?? 0) : undefined,
    radiusMeters: requireLocation ? form.radiusMeters ?? 100 : 0,
  };
}
