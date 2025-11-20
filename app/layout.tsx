import type { Metadata, Viewport } from "next"; // Tambahkan Viewport
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SamikStore POS - Aplikasi Kasir Pintar",
  description: "Sistem kasir profesional untuk UMKM. Manajemen stok, laporan keuangan, dan struk digital.",
  icons: {
    icon: '/favicon.ico', // Pastikan ada file favicon.ico di folder public (bisa pakai logo S anda)
  },
};

// Tambahkan ini agar di HP tidak bisa di-zoom (seperti aplikasi asli)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-slate-50`}>{children}</body>
    </html>
  );
}
