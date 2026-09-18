"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("ServiceWorker registration successful:", registration.scope);
          })
          .catch((err) => {
            console.warn("ServiceWorker registration failed:", err);
          });
      });
    }
  }, []);

  return null;
}
