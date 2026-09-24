import type { Metadata, Viewport } from "next";
import PwaManager from "@/components/pwa-manager";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "UltraPage Studio",
  title: "UltraPage Studio | Blackboard Ultra Content Editor",
  description: "Create accessible, responsive content and assessment packages for Blackboard Ultra.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UltraPage",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#5b2a86",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US">
      <body className="antialiased">
        {children}
        <PwaManager />
      </body>
    </html>
  );
}
