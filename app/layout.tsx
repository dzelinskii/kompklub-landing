import type { ReactNode } from "react";
import { Oswald, Inter } from "next/font/google";
import "./globals.css";

const display = Oswald({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700"],
  variable: "--font-oswald",
});

const body = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
