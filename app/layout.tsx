import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UltraPage Studio | Editor para Blackboard Ultra",
  description: "Crea páginas accesibles y conéctalas con los recursos de tu curso en Blackboard Ultra.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-PR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
