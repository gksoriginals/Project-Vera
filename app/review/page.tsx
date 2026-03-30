"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentSession } from "@/lib/client-api";
import type { SessionRecord } from "@/lib/types";

export default function ReviewPage() {
  const [session, setSession] = useState<SessionRecord | null>(null);

  useEffect(() => {
    getCurrentSession()
      .then(setSession)
      .catch(() => {
        setSession({
          id: "offline-demo",
          createdAt: new Date().toISOString(),
          preferences: {
            language: "English",
            readability: "Balanced simplification",
            pace: "Steady pace",
            ttsVoice: "hannah"
          },
          chunks: [],
          repliesPlayed: []
        });
      });
  }, []);

  if (!session) {
    return null;
  }

  return (
    <main className="screen-shell review-shell">
      <section className="page-panel">
        <div className="page-header">
          <div>
            <span className="wordmark">Vera</span>
            <p className="page-subtitle">Session review</p>
          </div>
          <Link className="secondary-link" href="/live">
            Back to live view
          </Link>
        </div>

        <div className="timeline-list">
          {session.chunks.length === 0 ? (
            <article className="timeline-item">
              <p className="timeline-primary">No live chunks have been captured in this session yet.</p>
              <p className="timeline-secondary">
                Once Vera processes microphone segments, the simplified history will appear here.
              </p>
            </article>
          ) : null}

          {session.chunks.map((stanza, index) => (
            <article className="timeline-item" key={stanza.id}>
              <div className="timeline-meta">
                <span>{stanza.timestamp}</span>
                <span>{stanza.speaker}</span>
              </div>
              <p className="timeline-primary">{stanza.simplified}</p>
              <p className="timeline-secondary">{stanza.original}</p>
              {session.repliesPlayed[index] ? (
                <div className="reply-chip">Reply played: {session.repliesPlayed[index].text}</div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
