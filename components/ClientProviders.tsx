"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { RealtimeProvider } from "@/components/RealtimeProvider";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RealtimeProvider>{children}</RealtimeProvider>
    </AuthProvider>
  );
}
