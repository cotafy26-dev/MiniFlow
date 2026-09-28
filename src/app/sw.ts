import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

// `self` typed loosely as `any` here rather than `ServiceWorkerGlobalScope`:
// that type comes from TypeScript's "webworker" lib, which conflicts with
// the "dom" lib the rest of the app's tsconfig.json uses. This file is
// only ever transpiled (not type-checked) by Next's build, so the loss of
// type-safety is confined to this one worker entry point.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const self: any;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.addEventListener("push", (event: any) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "MedFlow System", {
      body: data.body,
      icon: "/icon.png",
      data: { url: data.url ?? "/" },
    })
  );
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url ?? "/"));
});
