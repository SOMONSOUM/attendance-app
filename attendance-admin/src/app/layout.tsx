import type { ReactNode } from "react";
import { Koh_Santepheap, Inter } from "next/font/google";
import { AppearanceProvider } from "@/components/providers/appearance-provider";
import "./globals.css";

const kohSantepheap = Koh_Santepheap({
  weight: ["400", "700"],
  subsets: ["khmer"],
  display: "swap",
  variable: "--font-koh-santepheap",
});

const inter = Inter({
  weight: ["400", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="km" suppressHydrationWarning>
      <body
        className={`${kohSantepheap.variable} ${inter.variable} font-sans bg-background text-foreground`}
      >
        <AppearanceProvider>{children}</AppearanceProvider>
      </body>
    </html>
  );
}
