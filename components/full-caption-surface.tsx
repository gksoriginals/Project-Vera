"use client";

import { useEffect, useRef } from "react";
import { PretextLiveSurface } from "@/components/pretext-live-surface";
import type { LiveSurfaceMetrics } from "@/lib/types";

type FullCaptionSurfaceProps = {
  historyText: string;
  liveText: string;
  isCompareMode?: boolean;
  shellMode?: "mobile" | "tablet" | "desktop";
  onMetricsChange?: (metrics: LiveSurfaceMetrics) => void;
};

export function FullCaptionSurface({
  historyText,
  liveText,
  isCompareMode = false,
  shellMode = "desktop",
  onMetricsChange
}: FullCaptionSurfaceProps) {
  const historyViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = historyViewportRef.current;
    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [historyText]);

  const hasHistory = historyText.trim().length > 0;
  const hasLiveText = liveText.trim().length > 0;
  const liveFontSizing =
    shellMode === "mobile"
      ? { minFontSize: 40, maxFontSize: 68 }
      : shellMode === "tablet"
        ? { minFontSize: 38, maxFontSize: 64 }
        : isCompareMode
          ? { minFontSize: 24, maxFontSize: 42 }
          : { minFontSize: 34, maxFontSize: 60 };

  return (
    <section className="reading-surface full-transcript-surface">
      <div
        className={
          hasLiveText
            ? "full-transcript-history-viewport"
            : "full-transcript-history-viewport full-transcript-history-viewport-full"
        }
        ref={historyViewportRef}
      >
        {hasHistory ? (
          <p className="full-transcript-text full-transcript-history">{historyText}</p>
        ) : null}
      </div>

      {hasLiveText ? (
        <div className="full-transcript-live-region">
          <PretextLiveSurface
            className="live-surface full-transcript-live-surface"
            maxFontSize={liveFontSizing.maxFontSize}
            minFontSize={liveFontSizing.minFontSize}
            clipOverflowFromStart
            onMetricsChange={onMetricsChange}
            placeholder=""
            text={liveText}
          />
        </div>
      ) : null}
    </section>
  );
}
