"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";

export type AppearanceMode = "light" | "dark" | "system";

export function AppearanceProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableColorScheme
      enableSystem
      storageKey="admin-appearance"
    >
      {children}
    </ThemeProvider>
  );
}

export function useAppearance() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    theme: mounted && isAppearanceMode(theme) ? theme : "system",
    resolvedTheme:
      mounted && isResolvedTheme(resolvedTheme) ? resolvedTheme : "light",
    setTheme: (nextTheme: AppearanceMode) => setTheme(nextTheme),
  };
}

function isAppearanceMode(value: string | undefined): value is AppearanceMode {
  return value === "light" || value === "dark" || value === "system";
}

function isResolvedTheme(value: string | undefined): value is "light" | "dark" {
  return value === "light" || value === "dark";
}
