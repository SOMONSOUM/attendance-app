import type { ReactNode } from "react";
import { AppearanceProvider } from "@/components/providers/appearance-provider";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="km" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <AppearanceProvider>{children}</AppearanceProvider>
      </body>
    </html>
  );
}
