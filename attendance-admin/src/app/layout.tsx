import type { ReactNode } from "react";
import { Google_Sans } from "next/font/google";
import { AppearanceProvider } from "@/components/providers/appearance-provider";
import "./globals.css";

const googleSans = Google_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "khmer"],
  display: "swap",
  variable: "--font-google-sans",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="km" suppressHydrationWarning>
      <body
        className={`${googleSans.className} ${googleSans.variable} bg-background text-foreground`}
      >
        <AppearanceProvider>{children}</AppearanceProvider>
      </body>
    </html>
  );
}
