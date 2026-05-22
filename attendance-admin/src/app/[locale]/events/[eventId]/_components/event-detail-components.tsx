"use client";

import Link from "next/link";
import { Download, ExternalLink, MapPin, QrCode, type LucideIcon } from "lucide-react";
import { EmptyState, StatusPill } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="min-w-0">
      <CardContent className="p-4">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-medium">{label}</p>
          <span className="grid size-7 place-items-center rounded-md border border-border bg-background text-muted-fg">
            <Icon size={14} />
          </span>
        </div>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-fg">{sub}</p>
      </CardContent>
    </Card>
  );
}

export function LocationRequirementBadge({
  required,
}: {
  required?: boolean;
}) {
  return (
    <StatusPill tone={required ? "green" : "amber"}>
      {required ? "Location required" : "Location not required"}
    </StatusPill>
  );
}

export function EventDetailsCard({
  name,
  description,
  locationName,
  requireLocation,
  coordinates,
  startsAt,
  endsAt,
  shifts,
}: {
  name: string;
  description?: string | null;
  locationName: string;
  requireLocation?: boolean;
  coordinates: Coordinates | null;
  startsAt: string;
  endsAt: string;
  shifts?: Array<{
    id?: string;
    name: string;
    startTime: string;
    endTime: string;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Event details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Location</p>
            <LocationRequirementBadge required={requireLocation} />
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-fg">
            <MapPin size={14} />
            {locationName}
          </p>
          {requireLocation && coordinates ? (
            <MapPreview coordinates={coordinates} label={name} className="mt-3" />
          ) : null}
        </div>
        {description ? (
          <div>
            <p className="text-sm font-medium">Description</p>
            <p className="mt-1 text-sm text-muted-fg">{description}</p>
          </div>
        ) : null}
        <div className="grid gap-3">
          <p className="text-sm font-medium">Schedule</p>
          <div className="rounded-md border border-border bg-background p-3">
            <p className="font-medium">
              {new Date(startsAt).toLocaleDateString()}
            </p>
            <p className="mt-1 text-sm text-muted-fg">
              {formatDateRange(startsAt, endsAt)}
            </p>
          </div>
        </div>
        {shifts?.length ? (
          <div className="grid gap-3">
            <p className="text-sm font-medium">Shifts</p>
            {shifts.map((eventShift) => (
              <div
                key={eventShift.id ?? eventShift.name}
                className="rounded-md border border-border bg-background p-3"
              >
                <p className="font-medium">{eventShift.name}</p>
                <p className="mt-1 text-sm text-muted-fg">
                  {eventShift.startTime} - {eventShift.endTime}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function QrPlaceCard({
  name,
  locationName,
  description,
  total,
  joined,
  rate,
  qrImage,
  fileName,
  href,
  requireLocation,
  coordinates,
  showView,
}: {
  name: string;
  locationName?: string | null;
  description?: string | null;
  total: number;
  joined: number;
  rate: number;
  qrImage?: string;
  fileName: string;
  href: string;
  requireLocation?: boolean;
  coordinates: Coordinates | null;
  showView: boolean;
}) {
  return (
    <div className="grid gap-3 rounded-md border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{name}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-fg">
            <MapPin size={12} />
            {locationName || "Location not set"}
          </p>
        </div>
        <span className="grid size-8 place-items-center rounded-md border border-border text-muted-fg">
          <QrCode size={16} />
        </span>
      </div>
      <LocationRequirementBadge required={requireLocation} />
      {description ? (
        <p className="line-clamp-2 text-sm text-muted-fg">{description}</p>
      ) : null}
      {requireLocation && coordinates ? (
        <MapPreview coordinates={coordinates} label={name} compact />
      ) : null}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <Stat label="Users" value={total} />
        <Stat label="Joined" value={joined} />
        <Stat label="Rate" value={`${rate}%`} />
      </div>
      <div className="flex flex-wrap gap-2">
        {showView ? (
          <Button asChild className="h-8">
            <Link href={href}>View</Link>
          </Button>
        ) : null}
        {requireLocation && coordinates ? (
          <Button asChild variant="outline" className="h-8">
            <a
              href={mapUrl(coordinates)}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${name} in maps`}
            >
              <ExternalLink size={14} />
              Map
            </a>
          </Button>
        ) : null}
        <Button
          variant="outline"
          className="h-8"
          disabled={!qrImage}
          onClick={() => (qrImage ? downloadDataUrl(qrImage, fileName) : undefined)}
        >
          <Download size={14} />
          QR
        </Button>
      </div>
    </div>
  );
}

export function SingleQrCard({
  name,
  code,
  qrImage,
}: {
  name: string;
  code?: string;
  qrImage?: string;
}) {
  return (
    <div className="grid gap-3 rounded-md border border-border bg-background p-4 md:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Single event QR</p>
          <p className="mt-1 text-xs text-muted-fg">{code ?? "Generating QR"}</p>
        </div>
        <span className="grid size-8 place-items-center rounded-md border border-border text-muted-fg">
          <QrCode size={16} />
        </span>
      </div>
      {qrImage ? (
        <img
          src={qrImage}
          alt={`${name} QR code`}
          className="size-48 rounded-md border border-border bg-white p-2"
        />
      ) : (
        <div className="grid size-48 place-items-center rounded-md border border-dashed border-border text-sm text-muted-fg">
          Loading QR
        </div>
      )}
      <Button
        variant="outline"
        className="h-8 justify-self-start"
        disabled={!qrImage}
        onClick={() => (qrImage ? downloadDataUrl(qrImage, `${name}.png`) : undefined)}
      >
        <Download size={14} />
        Download QR
      </Button>
    </div>
  );
}

export function PlacesEmptyState() {
  return (
    <EmptyState
      title="No places configured"
      text="Add places to this event to generate room-specific QR codes."
    />
  );
}

function MapPreview({
  coordinates,
  label,
  compact = false,
  className,
}: {
  coordinates: Coordinates;
  label: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-md border border-border ${className ?? ""}`}>
      <iframe
        title={`${label} map`}
        src={mapEmbedUrl(coordinates)}
        className={compact ? "h-28 w-full" : "h-40 w-full"}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex items-center justify-between gap-2 border-t border-border bg-muted px-3 py-2 text-xs text-muted-fg">
        <span className="truncate">{formatCoordinates(coordinates)}</span>
        <a
          href={mapUrl(coordinates)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 font-medium text-foreground"
        >
          Open map
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-muted p-2">
      <p className="text-xs text-muted-fg">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

export function buildCoordinates(
  latitude: string | number | null | undefined,
  longitude: string | number | null | undefined,
) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;

  return { latitude: lat, longitude: lng };
}

function mapUrl(coordinates: Coordinates) {
  return `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`;
}

function mapEmbedUrl(coordinates: Coordinates) {
  return `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}&z=16&output=embed`;
}

function formatCoordinates(coordinates: Coordinates) {
  return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
}

function formatDateRange(startsAt: string, endsAt: string) {
  return `${new Date(startsAt).toLocaleString()} - ${new Date(endsAt).toLocaleString()}`;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename.replace(/[^\w.-]+/g, "-").toLowerCase();
  link.click();
}
