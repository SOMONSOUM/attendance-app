"use client";

import * as React from "react";
import { CalendarDays, Clock } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  ariaLabel,
  className,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const selectedDate = parseDate(value);
  const [open, setOpen] = React.useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={ariaLabel ?? placeholder}
          className={cn(
            "h-11 w-full justify-start px-3 text-left font-normal",
            !selectedDate && "text-muted-fg",
            className,
          )}
        >
          <CalendarDays size={16} />
          {selectedDate ? formatButtonDate(selectedDate) : placeholder}
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          className="z-50 rounded-md border border-border bg-popover p-0 text-popover-foreground shadow-lg outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <Calendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={(date) => {
              if (!date) return;
              onChange(toDateValue(date));
              setOpen(false);
            }}
            buttonVariant="ghost"
            className="rounded-md"
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Pick a time",
  className,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const currentValue = normalizeTime(value);
  const [hour = "07", minute = "00"] = currentValue.split(":");

  function updateTime(nextHour: string, nextMinute: string) {
    onChange(`${nextHour}:${nextMinute}`);
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-11 w-full justify-start px-3 text-left font-normal",
            !currentValue && "text-muted-fg",
            className,
          )}
        >
          <Clock size={16} />
          {currentValue || placeholder}
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          className="z-50 w-72 rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <div className="grid grid-cols-2 gap-3">
            <TimeColumn
              label="Hour"
              values={Array.from({ length: 24 }, (_, index) =>
                String(index).padStart(2, "0"),
              )}
              value={hour}
              onChange={(nextHour) => updateTime(nextHour, minute)}
            />
            <TimeColumn
              label="Minute"
              values={["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]}
              value={minute}
              onChange={(nextMinute) => updateTime(hour, nextMinute)}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button type="button" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function TimeColumn({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-fg">{label}</p>
      <div className="grid max-h-56 grid-cols-3 gap-1 overflow-y-auto rounded-md border border-border bg-background p-1">
        {values.map((item) => (
          <button
            key={item}
            type="button"
            className={cn(
              "grid h-8 place-items-center rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:outline-none",
              item === value &&
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function parseDate(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatButtonDate(date: Date) {
  return date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeTime(value?: string) {
  if (!value) return "";
  const [hour = "00", minute = "00"] = value.split(":");
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}
