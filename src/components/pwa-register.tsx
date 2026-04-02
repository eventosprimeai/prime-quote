"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Register SW
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[PQ] Service Worker registered:", registration.scope);

        // Check for updates every 60 seconds
        setInterval(() => registration.update(), 60000);
      })
      .catch((err) => console.warn("[PQ] SW registration failed:", err));

    // Request notification permission (non-blocking)
    if ("Notification" in window && Notification.permission === "default") {
      // Delay the permission request to avoid annoying the user on first load
      const timer = setTimeout(() => {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            subscribeToPush();
          }
        });
      }, 10000); // 10s after page load

      return () => clearTimeout(timer);
    } else if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      subscribeToPush();
    }
  }, []);

  return null;
}

async function subscribeToPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const existingSub = await registration.pushManager.getSubscription();

    if (existingSub) {
      // Already subscribed, send to server in case it's missing
      await sendSubscriptionToServer(existingSub);
      return;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.warn("[PQ] VAPID public key not configured");
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibility: true,
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    await sendSubscriptionToServer(subscription);
  } catch (err) {
    console.warn("[PQ] Push subscription failed:", err);
  }
}

async function sendSubscriptionToServer(subscription: PushSubscription) {
  try {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
  } catch (err) {
    console.warn("[PQ] Failed to send push subscription:", err);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
