import type { ReactNode } from "react";
import { AppearanceProvider } from "@/components/providers/appearance-provider";
import "./[locale]/globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="km" suppressHydrationWarning>
      <body>
        <AppearanceProvider>{children}</AppearanceProvider>
      </body>
    </html>
  );
}
