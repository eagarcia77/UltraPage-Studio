import type { Metadata, Viewport } from "next";
import PwaManager from "@/components/pwa-manager";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ultrapage-studio.onrender.com"),
  applicationName: "UltraPage Studio",
  title: "UltraPage Studio | Accessible Multi-LMS Content Editor",
  description: "Create accessible, responsive content for Blackboard Ultra, Canvas, Moodle, Brightspace, and standards-based LMS platforms.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: {
    title: "UltraPage Studio",
    description: "Accessible multi-LMS content authoring with native Blackboard assessment tools.",
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
