"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { Button } from "@/components/ui/button";
import { type AppearanceMode } from "@/components/appearance-provider";

export function ScanControls({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const nextLocale = locale === "km" ? "en" : "km";
  const countryCode = locale === "km" ? "KH" : "US";

  function switchLocale() {
    const nextPath = pathname.replace(/^\/(en|km)(?=\/|$)/, `/${nextLocale}`);
    router.replace(`${nextPath}${window.location.search}`);
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <AppearanceToggle />
      <Button
        type="button"
        variant="outline"
        className="h-9 border-border bg-card px-3 text-card-foreground shadow-sm hover:bg-secondary"
        aria-label="Switch language"
        onClick={switchLocale}
      >
        <ReactCountryFlag
          countryCode={countryCode}
          svg
          style={{ height: "1rem", width: "1.25rem" }}
        />
        {locale === "km" ? "ខ្មែរ" : "EN"}
      </Button>
    </div>
  );
}

function AppearanceToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = (theme as AppearanceMode | undefined) ?? "system";
  const options: Array<{
    value: AppearanceMode;
    icon: typeof Sun;
    label: string;
  }> = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  return (
    <div className="flex gap-1 rounded-md border border-border bg-card/90 p-1 shadow-sm backdrop-blur">
      {options.map((option) => {
        const Icon = option.icon;
        const active = mounted && current === option.value;

        return (
          <Button
            key={option.value}
            type="button"
            variant={active ? "secondary" : "ghost"}
            className="size-7 px-0"
            aria-label={option.label}
            aria-pressed={active}
            onClick={() => setTheme(option.value)}
          >
            <Icon size={14} />
          </Button>
        );
      })}
    </div>
  );
}
