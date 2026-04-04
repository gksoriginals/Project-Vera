"use client";

import type { ReactNode } from "react";

type SharedShellProps = {
  answerSheet?: ReactNode;
  fullCaptionSurface: ReactNode;
  simplifiedSurface: ReactNode;
  showCompare: boolean;
};

export function MobileLiveShell({
  answerSheet,
  fullCaptionSurface,
  simplifiedSurface,
  showCompare
}: SharedShellProps) {
  return (
    <div className="live-layout live-layout-mobile">
      <div className="live-primary-region">
        {showCompare ? fullCaptionSurface : simplifiedSurface}
      </div>
      {answerSheet}
    </div>
  );
}

export function TabletLiveShell({
  answerSheet,
  fullCaptionSurface,
  simplifiedSurface,
  showCompare
}: SharedShellProps) {
  return (
    <div className="live-layout live-layout-tablet">
      <div className="live-primary-region live-primary-region-tablet">
        {showCompare ? fullCaptionSurface : simplifiedSurface}
      </div>
      {answerSheet}
    </div>
  );
}

type DesktopShellProps = SharedShellProps & {
  desktopAnswerSheet?: ReactNode;
};

export function DesktopLiveShell({
  desktopAnswerSheet,
  fullCaptionSurface,
  simplifiedSurface,
  showCompare
}: DesktopShellProps) {
  return (
    <div className="live-layout live-layout-desktop">
      <div className="live-primary-region">
        {showCompare ? (
          <div className="live-compare-grid">
            <div className="live-compare-pane live-compare-pane-simplified">
              {simplifiedSurface}
            </div>
            <div className="live-compare-pane live-compare-pane-full">
              {fullCaptionSurface}
            </div>
          </div>
        ) : (
          simplifiedSurface
        )}
      </div>
      {desktopAnswerSheet ? (
        <aside className="live-secondary-region" aria-label="Desktop conversation context">
          {desktopAnswerSheet}
        </aside>
      ) : null}
    </div>
  );
}
