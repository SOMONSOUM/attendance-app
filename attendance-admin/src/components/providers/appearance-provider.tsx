"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

export type AppearanceMode = "light" | "dark" | "system";

export function AppearanceProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="admin-appearance"
    >
      {children}
    </ThemeProvider>
  );
}
