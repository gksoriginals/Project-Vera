"use client";

import { useEffect, useState } from "react";
import { DEFAULT_PREFERENCES } from "@/lib/mock-data";
import { bootstrapSession } from "@/lib/client-api";
import type { BootstrapPayload } from "@/lib/types";

const FALLBACK_BOOTSTRAP: BootstrapPayload = {
  appCopy: {
    purpose:
      "Live speech appears as calm, readable text so the conversation stays easier to follow."
  },
  preferences: DEFAULT_PREFERENCES,
  sessionId: "offline-demo"
};

export function useSessionBootstrap() {
  const [data, setData] = useState<BootstrapPayload>(FALLBACK_BOOTSTRAP);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    bootstrapSession()
      .then((next) => {
        if (!cancelled) {
          setData(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(FALLBACK_BOOTSTRAP);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ...data,
    isLoading
  };
}
