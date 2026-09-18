"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed / standalone
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isRunningStandalone);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iOS);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show prompt if not previously dismissed in this session
      const dismissed = sessionStorage.getItem("pwa-prompt-dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 md:left-auto md:right-6 md:max-w-sm">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
              <Download className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-100">Install Expense Tracker</h4>
              <p className="text-xs text-slate-400">
                Install as a PWA for instant access & offline use
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="mt-3 rounded-xl bg-slate-800/80 p-2.5 text-xs text-slate-300">
            <p className="flex items-center gap-1.5 font-medium">
              Tap <Share className="h-3.5 w-3.5 text-blue-400 inline" /> then choose{" "}
              <span className="text-blue-400 font-semibold flex items-center gap-1">
                Add to Home Screen <PlusSquare className="h-3.5 w-3.5" />
              </span>
            </p>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2 px-3 text-center text-xs font-semibold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 active:scale-95 transition-all"
            >
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-xl border border-slate-700 py-2 px-3 text-center text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
