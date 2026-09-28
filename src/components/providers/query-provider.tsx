"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Established now (Fase 1) even though no Fase 1 screen uses client-side
 * data fetching yet — every subsequent phase (mini-apps catalog, feed,
 * community, notifications, ...) needs it, so the pattern exists once
 * instead of being bolted on ad hoc later.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
