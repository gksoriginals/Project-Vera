"use client";

import { PretextLiveSurface } from "@/components/pretext-live-surface";
import type { ConversationChunk } from "@/lib/types";

type SimplifiedCaptionCardProps = {
  chunk: ConversationChunk;
  canToggleFullText?: boolean;
  className?: string;
  maxFontSize?: number;
  minFontSize?: number;
  onToggleFullText?: () => void;
  showFullText?: boolean;
};

export function SimplifiedCaptionCard({
  chunk,
  canToggleFullText = false,
  className,
  maxFontSize = 42,
  minFontSize = 22,
  onToggleFullText,
  showFullText = false
}: SimplifiedCaptionCardProps) {
  return (
    <article className={className ?? "simplified-caption-card"}>
      <div className="simplified-caption-header chunk-header">
        <p className="chunk-meta">{chunk.timestamp}</p>
        {canToggleFullText ? (
          <button
            aria-label={showFullText ? "Show simplified text" : "Show full text"}
            className="secondary-button inline-toggle-button"
            onClick={onToggleFullText}
            type="button"
          >
            {showFullText ? "Show simplified" : "Show full text"}
          </button>
        ) : null}
      </div>
      <div className="simplified-caption-body">
        <PretextLiveSurface
          className="simplified-caption-surface"
          maxFontSize={maxFontSize}
          minFontSize={minFontSize}
          placeholder=""
          text={showFullText ? chunk.original : chunk.simplified}
        />
      </div>
    </article>
  );
}
