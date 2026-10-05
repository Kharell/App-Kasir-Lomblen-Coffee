import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lomblen Cofe — Aplikasi Kasir",
  description:
    "Point of Sale untuk kedai kopi Lomblen Cofe: menu, keranjang, pembayaran, dan laporan shift.",
  applicationName: "Lomblen Cofe POS",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2b1a11",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-dvh bg-zinc-100 font-sans">{children}</body>
    </html>
  );
}