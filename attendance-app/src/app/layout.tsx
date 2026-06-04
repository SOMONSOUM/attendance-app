import type { ReactNode } from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="km" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
