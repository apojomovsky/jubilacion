import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Previsor — Jubilación privada Paraguay",
  description: "Proyectá tu jubilación privada considerando inflación real y salario mínimo de Paraguay.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full bg-gray-950 text-gray-100">{children}</body>
    </html>
  );
}
