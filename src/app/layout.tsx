import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agendamiento y Pagos",
  description: "Sistema de agendamiento online con pagos integrados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
