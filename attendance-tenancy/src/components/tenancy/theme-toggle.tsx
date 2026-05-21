import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type AppearanceMode,
  useAppearance,
} from "@/components/providers/appearance-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useAppearance();
  const options = [
    { value: "light", icon: Sun },
    { value: "dark", icon: Moon },
    { value: "system", icon: Monitor },
  ] as const;

  return (
    <div className="hidden gap-1 rounded-md border border-border bg-background p-1 sm:flex">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <Button
            key={option.value}
            type="button"
            variant={theme === option.value ? "secondary" : "ghost"}
            className="size-8 px-0"
            onClick={() => setTheme(option.value as AppearanceMode)}
          >
            <Icon size={15} />
          </Button>
        );
      })}
    </div>
  );
}
