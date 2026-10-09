import type { Metadata, Viewport } from "next";
import PwaManager from "@/components/pwa-manager";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ultrapage-studio.onrender.com"),
  applicationName: "Curralume Studio",
  title: "Curralume Studio | Accessible Multi-LMS Content Editor",
  description: "Create accessible, responsive content for Blackboard Ultra, Canvas, Moodle, Brightspace, and standards-based LMS platforms.",
  authors: [{ name: "Eduardo Augusto García Rodríguez" }],
  creator: "Eduardo Augusto García Rodríguez",
  publisher: "Eduardo Augusto García Rodríguez",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: {
    title: "Curralume Studio",
    description: "Accessible multi-LMS content authoring with native Blackboard assessment tools.",
    images: [{ url: "/brand/curralume-icon-512.png", width: 512, height: 512, alt: "Curralume Studio logo" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CL Studio",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    owner: "Eduardo Augusto García Rodríguez",
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
