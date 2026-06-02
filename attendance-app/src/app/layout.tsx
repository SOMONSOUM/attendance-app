import { Google_Sans, Noto_Sans_Khmer } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const googleSans = Google_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-google-sans",
});

const notoSansKhmer = Noto_Sans_Khmer({
  subsets: ["khmer"],
  variable: "--font-google-khmer",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="km" suppressHydrationWarning>
      <body className={`${googleSans.variable} ${notoSansKhmer.variable}`}>
        {children}
      </body>
    </html>
  );
}
