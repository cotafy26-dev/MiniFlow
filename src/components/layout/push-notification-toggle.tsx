"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { subscribeToPushAction, unsubscribeFromPushAction } from "@/core/push/actions";
import { pt } from "@/lib/i18n/dictionaries/pt";

// Web Push's applicationServerKey wants a raw Uint8Array, not the
// base64url string the VAPID public key is stored/transmitted as.
function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function isSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

export function PushNotificationToggle() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!isSupported()) return;

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        setSupported(true);
        setIsSubscribed(!!subscription);
      })
      .catch(() => {});
  }, []);

  async function handleSubscribe() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error(pt.push.permissionDenied);
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
    const json = subscription.toJSON();

    const result = await subscribeToPushAction(
      { endpoint: json.endpoint!, keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth } },
      navigator.userAgent
    );
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setIsSubscribed(true);
    toast.success(pt.push.enableSuccess);
  }

  async function handleUnsubscribe() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await unsubscribeFromPushAction(subscription.endpoint);
      await subscription.unsubscribe();
    }
    setIsSubscribed(false);
    toast.success(pt.push.disableSuccess);
  }

  async function handleClick() {
    if (!supported) {
      toast.error(pt.push.unsupported);
      return;
    }
    setIsBusy(true);
    try {
      if (isSubscribed) await handleUnsubscribe();
      else await handleSubscribe();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={isBusy}
      onClick={handleClick}
      aria-label={isSubscribed ? pt.push.disable : pt.push.enable}
      title={isSubscribed ? pt.push.enabled : pt.push.enable}
    >
      {isSubscribed ? <Bell className="size-4" /> : <BellOff className="size-4" />}
    </Button>
  );
}
