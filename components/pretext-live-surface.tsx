"use client";

import { layoutWithLines, prepareWithSegments } from "@chenglou/pretext";
import { useEffect, useRef, useState } from "react";
import type { LiveSurfaceMetrics } from "@/lib/types";

type PretextLiveSurfaceProps = {
  text: string;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
  clipOverflowFromStart?: boolean;
  placeholder?: string;
  emptyClassName?: string;
  onMetricsChange?: (metrics: LiveSurfaceMetrics) => void;
};

type SurfaceDimensions = {
  width: number;
  height: number;
};

type CalculatedLayout = {
  fontSize: number;
  lineHeight: number;
  lines: string[];
};

const DEFAULT_MIN_FONT_SIZE = 26;
const DEFAULT_MAX_FONT_SIZE = 54;
const FONT_FAMILY = '"Helvetica Neue", "Noto Sans", sans-serif';

export function PretextLiveSurface({
  text,
  className,
  minFontSize = DEFAULT_MIN_FONT_SIZE,
  maxFontSize = DEFAULT_MAX_FONT_SIZE,
  clipOverflowFromStart = false,
  placeholder = "Waiting for the next spoken phrase.",
  emptyClassName,
  onMetricsChange
}: PretextLiveSurfaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<SurfaceDimensions>({
    width: 0,
    height: 0
  });
  const [layout, setLayout] = useState<CalculatedLayout>({
    fontSize: maxFontSize,
    lineHeight: Math.round(maxFontSize * 1.16),
    lines: []
  });

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      });
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!text.trim() || !dimensions.width || !dimensions.height) {
      setLayout({
        fontSize: maxFontSize,
        lineHeight: Math.round(maxFontSize * 1.16),
        lines: []
      });
      onMetricsChange?.({
        occupancy: 0,
        lineCount: 0,
        fontSize: maxFontSize,
        isAtMinimumFontSize: false,
        isOverflowing: false
      });
      return;
    }

    let low = minFontSize;
    let high = maxFontSize;
    let best: CalculatedLayout = {
      fontSize: minFontSize,
      lineHeight: Math.round(minFontSize * 1.16),
      lines: [text]
    };

    while (low <= high) {
      const candidate = Math.floor((low + high) / 2);
      const lineHeight = Math.round(candidate * 1.16);
      const prepared = prepareWithSegments(text, `${candidate}px ${FONT_FAMILY}`);
      const result = layoutWithLines(prepared, dimensions.width, lineHeight);

      if (result.height <= dimensions.height) {
        best = {
          fontSize: candidate,
          lineHeight,
          lines: result.lines.map((line) => line.text)
        };
        low = candidate + 1;
      } else {
        high = candidate - 1;
      }
    }

    setLayout(best);
    const minPrepared = prepareWithSegments(text, `${minFontSize}px ${FONT_FAMILY}`);
    const minResult = layoutWithLines(
      minPrepared,
      dimensions.width,
      Math.round(minFontSize * 1.16)
    );

    if (clipOverflowFromStart && minResult.height > dimensions.height) {
      const words = text.trim().split(/\s+/).filter(Boolean);
      let low = 1;
      let high = words.length;
      let bestResult = layoutWithLines(
        prepareWithSegments(words.slice(-1).join(" "), `${minFontSize}px ${FONT_FAMILY}`),
        dimensions.width,
        Math.round(minFontSize * 1.16)
      );

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidateText = words.slice(-mid).join(" ");
        const candidateResult = layoutWithLines(
          prepareWithSegments(candidateText, `${minFontSize}px ${FONT_FAMILY}`),
          dimensions.width,
          Math.round(minFontSize * 1.16)
        );

        if (candidateResult.height <= dimensions.height) {
          bestResult = candidateResult;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      setLayout({
        fontSize: minFontSize,
        lineHeight: Math.round(minFontSize * 1.16),
        lines: bestResult.lines.map((line) => line.text)
      });

      onMetricsChange?.({
        occupancy: Math.min(bestResult.height / dimensions.height, 1),
        lineCount: bestResult.lines.length,
        fontSize: minFontSize,
        isAtMinimumFontSize: true,
        isOverflowing: true
      });
      return;
    }

    const occupancy = Math.min(minResult.height / dimensions.height, 1);

    onMetricsChange?.({
      occupancy,
      lineCount: best.lines.length,
      fontSize: best.fontSize,
      isAtMinimumFontSize: best.fontSize <= minFontSize,
      isOverflowing: minResult.height > dimensions.height
    });
  }, [
    clipOverflowFromStart,
    dimensions.height,
    dimensions.width,
    maxFontSize,
    minFontSize,
    onMetricsChange,
    text
  ]);

  return (
    <div className={className ?? "live-surface"} ref={containerRef}>
      {layout.lines.length === 0 ? (
        text.trim() ? (
          <div
            className="live-lines"
            style={{
              fontSize: `${Math.max(minFontSize, Math.min(maxFontSize, maxFontSize - 4))}px`,
              lineHeight: `${Math.round(
                Math.max(minFontSize, Math.min(maxFontSize, maxFontSize - 4)) * 1.16
              )}px`
            }}
          >
            <p>{text}</p>
          </div>
        ) : placeholder ? (
          <p className={emptyClassName ?? "surface-placeholder"}>{placeholder}</p>
        ) : null
      ) : (
        <div
          className="live-lines"
          style={{
            fontSize: `${layout.fontSize}px`,
            lineHeight: `${layout.lineHeight}px`
          }}
        >
          {layout.lines.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
