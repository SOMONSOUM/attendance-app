"use client";

import { Map, MapPin, Minus, Navigation, Plus, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LocationPickerValue = {
  requireLocation?: boolean;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
};

type DragState =
  | {
      type: "map";
      pointerId: number;
      startX: number;
      startY: number;
      lat: number;
      lng: number;
      moved: boolean;
    }
  | { type: "marker"; pointerId: number };

const TILE_SIZE = 256;
const DEFAULT_ZOOM = 15;
const MIN_ZOOM = 3;
const MAX_ZOOM = 19;
const DEFAULT_LAT = 11.5564;
const DEFAULT_LNG = 104.9282;
const RADIUS_OPTIONS = [50, 100, 200, 500];
const TILE_SOURCES = {
  map: {
    label: "Map",
    tileUrl: (zoom: number, x: number, y: number) =>
      `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
  },
  satellite: {
    label: "Satellite",
    tileUrl: (zoom: number, x: number, y: number) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`,
  },
} as const;

export function LocationPicker({
  value,
  onChange,
  title = "Location check-in",
}: {
  value: LocationPickerValue;
  onChange: (value: LocationPickerValue) => void;
  title?: string;
}) {
  const latitude = Number.isFinite(value.latitude) ? value.latitude! : DEFAULT_LAT;
  const longitude = Number.isFinite(value.longitude) ? value.longitude! : DEFAULT_LNG;
  const radiusMeters = value.radiusMeters ?? 100;
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [tileSource, setTileSource] = useState<keyof typeof TILE_SOURCES>("map");
  const center = useMemo(
    () => latLngToWorld(latitude, longitude, zoom),
    [latitude, longitude, zoom],
  );
  const tiles = useMemo(() => {
    const centerTileX = Math.floor(center.x / TILE_SIZE);
    const centerTileY = Math.floor(center.y / TILE_SIZE);
    const result: Array<{
      x: number;
      y: number;
      left: number;
      top: number;
      url: string;
    }> = [];
    const source = TILE_SOURCES[tileSource];

    for (let offsetY = -2; offsetY <= 2; offsetY += 1) {
      for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
        const x = wrapTileX(centerTileX + offsetX, zoom);
        const y = centerTileY + offsetY;
        if (y < 0 || y >= 2 ** zoom) continue;

        result.push({
          x,
          y,
          left: 50 + offsetX * 20,
          top: 50 + offsetY * 20,
          url: source.tileUrl(zoom, x, y),
        });
      }
    }

    return result;
  }, [center, tileSource, zoom]);

  function update(patch: LocationPickerValue) {
    onChange({ ...value, ...patch });
  }

  function setPoint(lat: number, lng: number) {
    update({
      latitude: clampCoordinate(lat, -85, 85),
      longitude: clampCoordinate(lng, -180, 180),
    });
  }

  function pointerToLatLng(
    event: ReactPointerEvent<HTMLDivElement> | ReactMouseEvent<HTMLDivElement>,
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    const worldX = center.x + event.clientX - rect.left - rect.width / 2;
    const worldY = center.y + event.clientY - rect.top - rect.height / 2;
    return worldToLatLng(worldX, worldY, zoom);
  }

  function onMapPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("[data-map-marker]")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({
      type: "map",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lat: latitude,
      lng: longitude,
      moved: false,
    });
  }

  function onMarkerPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({ type: "marker", pointerId: event.pointerId });
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    if (dragState.type === "marker") {
      const next = pointerToLatLng(event);
      setPoint(next.lat, next.lng);
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const moved = dragState.moved || Math.hypot(deltaX, deltaY) > 5;
    if (moved !== dragState.moved) {
      setDragState({ ...dragState, moved });
    }

    if (!moved) return;

    const startWorld = latLngToWorld(dragState.lat, dragState.lng, zoom);
    const next = worldToLatLng(
      startWorld.x - deltaX,
      startWorld.y - deltaY,
      zoom,
    );
    setPoint(next.lat, next.lng);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    if (dragState.type === "map" && !dragState.moved) {
      const next = pointerToLatLng(event);
      setPoint(next.lat, next.lng);
    }
    setDragState(null);
  }

  return (
    <section className="grid gap-3 rounded-md border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck size={16} className="text-primary" />
            {title}
          </h3>
          <p className="mt-1 text-xs text-muted-fg">
            Require attendees to share their current location before the QR check-in is accepted.
          </p>
        </div>
        <Button
          type="button"
          variant={value.requireLocation ? "secondary" : "outline"}
          className="h-8 shrink-0"
          onClick={() => update({ requireLocation: !value.requireLocation })}
        >
          {value.requireLocation ? "Required" : "Optional"}
        </Button>
      </div>

      {value.requireLocation ? (
        <>
          <div className="grid gap-2">
            <Label>Location name</Label>
            <Input
              value={value.locationName ?? ""}
              placeholder="Main venue, hall, or building"
              onChange={(event) => update({ locationName: event.target.value })}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex rounded-md border border-border bg-card p-1">
              {(Object.keys(TILE_SOURCES) as Array<keyof typeof TILE_SOURCES>).map(
                (source) => (
                  <Button
                    key={source}
                    type="button"
                    variant={tileSource === source ? "secondary" : "ghost"}
                    className="h-8"
                    onClick={() => setTileSource(source)}
                  >
                    <Map size={14} />
                    {TILE_SOURCES[source].label}
                  </Button>
                ),
              )}
            </div>
            <div className="flex rounded-md border border-border bg-card p-1">
              <Button
                type="button"
                variant="ghost"
                className="size-8 px-0"
                aria-label="Zoom out"
                disabled={zoom <= MIN_ZOOM}
                onClick={() => setZoom((current) => Math.max(current - 1, MIN_ZOOM))}
              >
                <Minus size={14} />
              </Button>
              <span className="grid h-8 min-w-10 place-items-center text-xs font-medium text-muted-fg">
                {zoom}
              </span>
              <Button
                type="button"
                variant="ghost"
                className="size-8 px-0"
                aria-label="Zoom in"
                disabled={zoom >= MAX_ZOOM}
                onClick={() => setZoom((current) => Math.min(current + 1, MAX_ZOOM))}
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>
          <div
            className="relative h-56 cursor-crosshair overflow-hidden rounded-md border border-border bg-muted touch-none"
            onPointerDown={onMapPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {tiles.map((tile) => (
              <img
                key={`${tile.x}-${tile.y}`}
                alt=""
                className="absolute h-1/5 w-1/5 select-none object-cover"
                draggable={false}
                src={tile.url}
                style={{
                  left: `${tile.left}%`,
                  top: `${tile.top}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border-2 border-primary/70 bg-primary/15"
              style={{
                width: `${Math.max(36, Math.min(180, radiusMeters / 2))}px`,
                height: `${Math.max(36, Math.min(180, radiusMeters / 2))}px`,
                transform: "translate(-50%, -50%)",
              }}
            />
            <button
              type="button"
              aria-label="Drag location marker"
              className="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-full place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"
              data-map-marker
              onPointerDown={onMarkerPointerDown}
            >
              <MapPin size={20} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <NumberField
              label="Latitude"
              step="0.000001"
              value={latitude}
              onChange={(next) => update({ latitude: next })}
            />
            <NumberField
              label="Longitude"
              step="0.000001"
              value={longitude}
              onChange={(next) => update({ longitude: next })}
            />
            <NumberField
              label="Radius meters"
              min={10}
              max={5000}
              step="10"
              value={radiusMeters}
              onChange={(next) => update({ radiusMeters: next })}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map((radius) => (
              <Button
                key={radius}
                type="button"
                variant={radiusMeters === radius ? "secondary" : "outline"}
                className="h-8"
                onClick={() => update({ radiusMeters: radius })}
              >
                {radius}m
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-8"
              onClick={() => {
                if (!navigator.geolocation) return;
                navigator.geolocation.getCurrentPosition((position) =>
                  update({
                    latitude: Number(position.coords.latitude.toFixed(7)),
                    longitude: Number(position.coords.longitude.toFixed(7)),
                  }),
                );
              }}
            >
              <Navigation size={14} />
              Use my location
            </Button>
          </div>
        </>
      ) : null}
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={String(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function latLngToWorld(lat: number, lng: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLat = Math.sin((clampCoordinate(lat, -85, 85) * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y:
      (0.5 -
        Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) *
      scale,
  };
}

function worldToLatLng(x: number, y: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return {
    lat: Number(clampCoordinate(lat, -85, 85).toFixed(7)),
    lng: Number(clampCoordinate(lng, -180, 180).toFixed(7)),
  };
}

function wrapTileX(x: number, zoom: number) {
  const tileCount = 2 ** zoom;
  return ((x % tileCount) + tileCount) % tileCount;
}

function clampCoordinate(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}
