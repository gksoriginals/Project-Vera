"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updatePreferences } from "@/lib/client-api";
import { useSessionBootstrap } from "@/hooks/use-session-bootstrap";
import { useSessionContext } from "@/lib/contexts/session-context";

export default function SetupPage() {
  const router = useRouter();
  const { appCopy, preferences, isLoading } = useSessionBootstrap();
  const { config, setConfig } = useSessionContext();
  const [isSaving, setIsSaving] = useState(false);
  const [groqApiKey, setGroqApiKey] = useState(config.groqApiKey || "");

  async function handleStartConversation() {
    setIsSaving(true);
    setConfig({
      groqApiKey
    });

    try {
      // Defaulting to English and standard preferences as requested
      await updatePreferences({
        language: "English",
        readability: "Balanced simplification",
        pace: "Steady pace",
        ttsVoice: preferences.ttsVoice
      });
    } finally {
      setIsSaving(false);
      router.push("/live");
    }
  }

  return (
    <main className="screen-shell">
      <section className="setup-panel">
        <div className="wordmark-row">
          <span className="wordmark">Vera</span>
          <span className="utility-note">
            {isLoading ? "Preparing session" : "Ready for live audio"}
          </span>
        </div>

        <p className="setup-purpose">{appCopy.purpose}</p>

        <div className="field-stack">
          <div className="collapsible-section">
            <p className="field-label">Groq API Key (Ephemeral)</p>
            <p className="field-help">Provide your key for this session. It is never stored on any server.</p>
            <div className="field-stack" style={{ marginTop: '0.5rem' }}>
              <label className="field">
                <input 
                  type="password" 
                  autoComplete="off"
                  placeholder="gsk_..." 
                  className="setup-input"
                  value={groqApiKey} 
                  onChange={(e) => setGroqApiKey(e.target.value)} 
                />
              </label>
            </div>
          </div>
        </div>

        <div className="setup-actions">
          <button 
            className="primary-button" 
            onClick={() => void handleStartConversation()} 
            type="button"
            disabled={isLoading || isSaving}
          >
            {isSaving ? "Starting..." : "Start conversation"}
          </button>
        </div>
      </section>
    </main>
  );
}
