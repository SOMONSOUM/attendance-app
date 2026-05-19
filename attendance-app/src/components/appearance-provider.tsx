"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

export type AppearanceMode = "light" | "dark" | "system";

export function AppearanceProvider({
  children,
  defaultTheme = "system",
}: {
  children: ReactNode;
  defaultTheme?: AppearanceMode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      storageKey="attendance-appearance"
    >
      {children}
    </ThemeProvider>
  );
}
