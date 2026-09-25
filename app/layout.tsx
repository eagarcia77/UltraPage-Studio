import type { Metadata, Viewport } from "next";
import PwaManager from "@/components/pwa-manager";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ultrapage-studio.onrender.com"),
  applicationName: "UltraPage Studio",
  title: "UltraPage Studio | Blackboard Ultra Content Editor",
  description: "Create accessible, responsive content and assessment packages for Blackboard Ultra.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: {
    title: "UltraPage Studio",
    description: "Accessible content authoring and native tools for Blackboard Ultra.",
    images: [{ url: "/brand/ultrapage-icon-512.png", width: 512, height: 512, alt: "UltraPage Studio logo" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UP Studio",
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
