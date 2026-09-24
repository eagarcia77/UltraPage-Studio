"use client";

import { useEffect, useState } from "react";
import styles from "./pwa-manager.module.css";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function PwaManager() {
  const [online, setOnline] = useState(true);
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [iosInstall, setIosInstall] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // The editor remains fully functional when service workers are unavailable.
      });
    }

    const installedStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setIosInstall(/iphone|ipad|ipod/i.test(navigator.userAgent) && !installedStandalone);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setPrompt(null);
      setIosInstall(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = async () => {
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setPrompt(null);
      return;
    }
    if (iosInstall) {
      window.alert("To install UltraPage Studio on this device, tap Share and then Add to Home Screen.");
    }
  };

  if (online && !prompt && !iosInstall) return null;

  return (
    <div className={styles.controls} aria-live="polite">
      {!online && (
        <span className={styles.offline} role="status">
          <span className={styles.dot} aria-hidden="true" />
          Offline mode
        </span>
      )}
      {(prompt || iosInstall) && (
        <button type="button" className={styles.install} onClick={install}>
          Install UltraPage
        </button>
      )}
    </div>
  );
}
