"use client";

import type { ContextAnswer } from "@/lib/types";

type ContextAnswerSheetProps = {
  answer: ContextAnswer | null;
  className?: string;
  onDismiss: () => void;
};

export function ContextAnswerSheet({
  answer,
  className,
  onDismiss
}: ContextAnswerSheetProps) {
  if (!answer) {
    return null;
  }

  return (
    <aside className={className ? `answer-sheet ${className}` : "answer-sheet"}>
      <div className="answer-sheet-header">
        <div>
          <p className="field-label">Answer</p>
          <h2>{answer.title}</h2>
        </div>
        <button className="tertiary-button" onClick={onDismiss} type="button">
          Dismiss
        </button>
      </div>
      <p className="answer-body">{answer.body}</p>
      <ul className="support-list">
        {answer.supportingPoints.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </aside>
  );
}
