import { Google_Sans } from "next/font/google";
import "./globals.css";

const googleSans = Google_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-google-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="km" suppressHydrationWarning>
      <body
        className={`${googleSans.className} ${googleSans.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
