import type { ReactNode } from "react";
import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Компьютерный клуб — скоро открытие",
  description:
    "Компьютерный клуб в уличной эстетике: топовое железо, VIP-зона, консоли, приватная комната и бар. Скоро открытие.",
  openGraph: {
    title: "Компьютерный клуб — скоро открытие",
    description: "Топовое железо, уличная атмосфера. Скоро открытие.",
    type: "website",
    locale: "ru_RU",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
