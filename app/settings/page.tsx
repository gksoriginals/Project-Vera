"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPreferences, updatePreferences } from "@/lib/client-api";
import type { UserPreferences } from "@/lib/types";

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    getPreferences()
      .then((response) => setPreferences(response.preferences))
      .catch(() => {
        setPreferences({
          language: "English",
          readability: "Balanced simplification",
          pace: "Steady pace",
          ttsVoice: "hannah"
        });
      });
  }, []);

  if (!preferences) {
    return null;
  }

  async function updateField<Key extends keyof UserPreferences>(
    key: Key,
    value: UserPreferences[Key]
  ) {
    const next: UserPreferences = {
      ...preferences,
      [key]: value
    } as UserPreferences;

    setPreferences(next);
    await updatePreferences(next);
  }

  return (
    <main className="screen-shell review-shell">
      <section className="page-panel">
        <div className="page-header">
          <div>
            <span className="wordmark">Vera</span>
            <p className="page-subtitle">Personalization and accessibility</p>
          </div>
          <Link className="secondary-link" href="/live">
            Back to live view
          </Link>
        </div>

        <div className="settings-list">
          <label className="setting-card">
            <span className="field-label">Reading density</span>
            <span className="setting-description">
              Controls how aggressively Vera shortens each finalized chunk.
            </span>
            <select
              onChange={(event) =>
                void updateField("readability", event.target.value as UserPreferences["readability"])
              }
              value={preferences.readability}
            >
              <option>Balanced simplification</option>
              <option>Clearer wording</option>
              <option>Compressed for speed</option>
            </select>
          </label>

          <label className="setting-card">
            <span className="field-label">Caption pace</span>
            <span className="setting-description">
              Sets how much live text Vera tries to keep readable at once.
            </span>
            <select
              onChange={(event) =>
                void updateField("pace", event.target.value as UserPreferences["pace"])
              }
              value={preferences.pace}
            >
              <option>Steady pace</option>
              <option>Faster updates</option>
              <option>More spacing</option>
            </select>
          </label>

          <label className="setting-card">
            <span className="field-label">Language</span>
            <span className="setting-description">
              Choose the default language used for live rendering and support text.
            </span>
            <select
              onChange={(event) => void updateField("language", event.target.value)}
              value={preferences.language}
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Tamil</option>
            </select>
          </label>

          <label className="setting-card">
            <span className="field-label">Reply voice</span>
            <span className="setting-description">
              Select the Groq TTS voice used for spoken replies.
            </span>
            <select
              onChange={(event) =>
                void updateField("ttsVoice", event.target.value as UserPreferences["ttsVoice"])
              }
              value={preferences.ttsVoice}
            >
              <option>hannah</option>
              <option>autumn</option>
              <option>austin</option>
              <option>daniel</option>
              <option>diana</option>
              <option>troy</option>
            </select>
          </label>
        </div>
      </section>
    </main>
  );
}
