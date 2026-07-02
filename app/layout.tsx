import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BUSINESS_CONFIG } from "@/lib/config";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${BUSINESS_CONFIG.name} — Reserva tu cita`,
  description: `Reserva tu cita en ${BUSINESS_CONFIG.name}. Cortes de pelo profesionales en ${BUSINESS_CONFIG.address}.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
