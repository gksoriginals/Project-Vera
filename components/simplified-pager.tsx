"use client";

import { useMemo, useRef, type TouchEvent, type WheelEvent } from "react";
import { SimplifiedCaptionCard } from "@/components/simplified-caption-card";
import type { ConversationChunk } from "@/lib/types";

const SWIPE_VIEWPORT_RATIO = 0.08;
const WHEEL_VIEWPORT_RATIO = 0.12;

type SimplifiedPagerProps = {
  className?: string;
  currentChunk?: ConversationChunk;
  historyChunks: ConversationChunk[];
  historyMaxFontSize?: number;
  historyMinFontSize?: number;
  pageIndex: number;
  totalPages: number;
  goToPage: (nextPage: number) => void;
  currentMaxFontSize?: number;
  currentMinFontSize?: number;
  showFullText: boolean;
  onToggleFullText: () => void;
};

export function SimplifiedPager({
  className,
  currentChunk,
  historyChunks,
  historyMaxFontSize = 42,
  historyMinFontSize = 22,
  pageIndex,
  totalPages,
  goToPage,
  currentMaxFontSize = 42,
  currentMinFontSize = 22,
  showFullText,
  onToggleFullText
}: SimplifiedPagerProps) {
  const surfaceRef = useRef<HTMLElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const wheelAccumulatorRef = useRef(0);
  const wheelResetTimeoutRef = useRef<number | null>(null);
  const pages = useMemo(
    () => [currentChunk, ...historyChunks].filter((chunk): chunk is ConversationChunk => Boolean(chunk)),
    [currentChunk, historyChunks]
  );
  const activeChunk = pages[pageIndex];

  function getViewportThreshold() {
    const height = surfaceRef.current?.clientHeight ?? 0;
    return height > 0 ? Math.max(48, height * WHEEL_VIEWPORT_RATIO) : 72;
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    if (touchStartYRef.current === null) {
      return;
    }

    const endY = event.changedTouches[0]?.clientY ?? touchStartYRef.current;
    const deltaY = touchStartYRef.current - endY;
    touchStartYRef.current = null;
    const surfaceHeight = surfaceRef.current?.clientHeight ?? 0;
    const swipeThreshold = surfaceHeight > 0 ? Math.max(40, surfaceHeight * SWIPE_VIEWPORT_RATIO) : 56;

    if (Math.abs(deltaY) < swipeThreshold) {
      return;
    }

    if (deltaY > 0) {
      goToPage(pageIndex - 1);
      return;
    }

    goToPage(pageIndex + 1);
  }

  function handleWheel(event: WheelEvent<HTMLElement>) {
    if (Math.abs(event.deltaY) < 1) {
      return;
    }

    event.preventDefault();
    wheelAccumulatorRef.current += event.deltaY;

    if (wheelResetTimeoutRef.current !== null) {
      window.clearTimeout(wheelResetTimeoutRef.current);
    }

    wheelResetTimeoutRef.current = window.setTimeout(() => {
      wheelAccumulatorRef.current = 0;
      wheelResetTimeoutRef.current = null;
    }, 140);

    const threshold = getViewportThreshold();

    if (Math.abs(wheelAccumulatorRef.current) < threshold) {
      return;
    }

    const direction = wheelAccumulatorRef.current;
    wheelAccumulatorRef.current = 0;

    if (direction > 0) {
      goToPage(pageIndex - 1);
      return;
    }

    goToPage(pageIndex + 1);
  }

  return (
    <section
      className={`reading-surface swipe-surface simplified-reading-surface simplified-pager ${className ?? ""}`.trim()}
      ref={surfaceRef}
      onTouchEnd={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onWheel={handleWheel}
    >
      <div className="simplified-page-shell">
        {activeChunk ? (
          <SimplifiedCaptionCard
            canToggleFullText
            chunk={activeChunk}
            className={
              pageIndex === 0
                ? "simplified-caption-card simplified-caption-card-current"
                : "simplified-caption-card simplified-caption-card-history"
            }
            maxFontSize={pageIndex === 0 ? currentMaxFontSize : historyMaxFontSize}
            minFontSize={pageIndex === 0 ? currentMinFontSize : historyMinFontSize}
            onToggleFullText={onToggleFullText}
            showFullText={showFullText}
          />
        ) : null}
      </div>

      {totalPages > 1 ? (
        <div className="page-dots" aria-hidden="true">
          {Array.from({ length: totalPages }, (_, index) => (
            <span className={index === pageIndex ? "page-dot active" : "page-dot"} key={index} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
