/** CREVELIO — © 2026 Eduardo Augusto García Rodríguez. All rights reserved. */
import type { Metadata, Viewport } from "next";
import PwaManager from "@/components/pwa-manager";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ultrapage-studio.onrender.com"),
  applicationName: "CREVELIO",
  title: "CREVELIO | Accessible Multi-LMS Content Editor",
  description: "Create accessible, responsive content for Blackboard Ultra, Canvas, Moodle, Brightspace, and standards-based LMS platforms.",
  authors: [{ name: "Eduardo Augusto García Rodríguez" }],
  creator: "Eduardo Augusto García Rodríguez",
  publisher: "ZENQAVIO Technologies",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: {
    title: "CREVELIO",
    description: "Accessible multi-LMS content authoring with native Blackboard assessment tools.",
    images: [{ url: "/brand/crevelio-icon-512.png", width: 512, height: 512, alt: "CREVELIO C/V symbol, by ZENQAVIO Technologies" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CREVELIO",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    owner: "Eduardo Augusto García Rodríguez",
    operator: "ZENQAVIO Technologies",
    "responsible-company": "ZENQAVIO Technologies",
    copyright: "© 2026 Eduardo Augusto García Rodríguez. All rights reserved.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#087A70",
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
