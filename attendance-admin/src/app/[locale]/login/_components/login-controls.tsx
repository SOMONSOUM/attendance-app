"use client";

import { usePathname, useRouter } from "next/navigation";
import ReactCountryFlag from "react-country-flag";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type AppearanceMode,
  useAppearance,
} from "@/components/providers/appearance-provider";

export function LoginControls({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const nextLocale = locale === "km" ? "en" : "km";
  const countryCode = locale === "km" ? "KH" : "US";

  function switchLocale() {
    router.replace(pathname.replace(/^\/(en|km)(?=\/|$)/, `/${nextLocale}`));
  }

  return (
    <div className="absolute right-6 top-6 flex items-center gap-2">
      <AppearanceToggle />
      <Button
        variant="outline"
        className="h-9 px-3"
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
  const { theme, setTheme } = useAppearance();
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
    <div className="flex gap-1 rounded-md border border-border bg-background/85 p-1 shadow-sm backdrop-blur">
      {options.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;

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
