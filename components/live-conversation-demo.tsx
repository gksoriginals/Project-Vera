"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import Link from "next/link";
import { ContextAnswerSheet } from "@/components/context-answer-sheet";
import { PretextLiveSurface } from "@/components/pretext-live-surface";
import { useLiveConversation } from "@/hooks/use-live-conversation";

const SWIPE_THRESHOLD = 56;
const WHEEL_THRESHOLD = 90;

function ResetIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M3 6h 18M19 6 v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M10.3 2h3.4l.5 2.2c.7.2 1.4.5 2 .8l2-1.1 2.4 2.4-1.1 2c.4.6.6 1.3.8 2L22 10.3v3.4l-2.2.5c-.2.7-.5 1.4-.8 2l1.1 2-2.4 2.4-2-1.1c-.6.4-1.3.6-2 .8L13.7 22h-3.4l-.5-2.2c-.7-.2-1.4-.5-2-.8l-2 1.1-2.4-2.4 1.1-2c-.4-.6-.6-1.3-.8-2L2 13.7v-3.4l2.2-.5c.2-.7.5-1.4.8-2l-1.1-2 2.4-2.4 2 1.1c.6-.4 1.3-.6 2-.8L10.3 2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function SimplifiedModeIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
      <path
        d="M4 8.5h16M4 12h10M4 15.5h16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function MicrophoneIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
      <path
        d="M12 3.5a3.2 3.2 0 0 1 3.2 3.2v5.2a3.2 3.2 0 1 1-6.4 0V6.7A3.2 3.2 0 0 1 12 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M6.5 11.6a5.5 5.5 0 0 0 11 0M12 17.1v3.4M8.8 20.5h6.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
      <path
        d="M4 12 19 5l-4.5 14-2.8-5-7.7-2Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ShrinkIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24">
      <path
        d="M4 14h6m0 0v6m0-6-7 7M20 10h-6m0 0V4m0 6 7-7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24">
      <path
        d="M15 3h6m0 0v6m0-6-7 7M9 21H3m0 0v-6m0 6 7-7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2"
        ry="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M10 13h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function LiveConversationDemo() {
  const touchStartYRef = useRef<number | null>(null);
  const wheelLockRef = useRef(false);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const {
    answer,
    composerValue,
    connectionLabel,
    dismissAnswer,
    expandedHistoryChunkId,
    historyPages,
    isBusy,
    isListening,
    keyboardInputRef,
    latestChunk,
    liveChunkExpanded,
    livePageClassName,
    pageIndex,
    paceValue,
    previousChunk,
    replySuggestions,
    runningCaptionsEnabled,
    speakingReplyId,
    totalPages,
    visibleActiveWords,
    goToPage,
    handleLiveSurfaceMetricsChange,
    isMicrophoneSupported,
    setComposerValue,
    setPaceValue,
    toggleMicrophone,
    submitComposer,
    speakText,
    speakReply,
    toggleExpandedHistoryChunk,
    toggleLiveChunkExpanded,
    toggleRunningCaptions,
    resetSession
  } = useLiveConversation();

  const [viewportBottom, setViewportBottom] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) {
      return;
    }

    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      
      const offset = vv.height < window.innerHeight 
        ? window.innerHeight - vv.height - vv.offsetTop
        : 0;
      
      setViewportBottom(offset);
    };

    window.visualViewport.addEventListener("resize", handleResize);
    window.visualViewport.addEventListener("scroll", handleResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
  }, []);

  const showPausedPair = !visibleActiveWords && Boolean(previousChunk && latestChunk);

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

    if (Math.abs(deltaY) < SWIPE_THRESHOLD) {
      return;
    }

    if (deltaY > 0) {
      goToPage(pageIndex - 1);
      return;
    }

    goToPage(pageIndex + 1);
  }

  function handleWheel(deltaY: number) {
    if (wheelLockRef.current || Math.abs(deltaY) < WHEEL_THRESHOLD) {
      return;
    }

    wheelLockRef.current = true;
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 280);

    if (deltaY > 0) {
      goToPage(pageIndex - 1);
      return;
    }

    goToPage(pageIndex + 1);
  }
  return (
    <main className="live-shell">
      <section className="live-panel app-shell">
        <header className="top-bar">
          <div className="top-bar-leading">
            <span className="wordmark">Vera</span>
            <span
              aria-label={connectionLabel}
              className="connection-dot"
              title={connectionLabel}
            />
          </div>
          <div className="top-bar-actions">
            <button
              aria-label="New Session"
              className="icon-button"
              onClick={() => {
                if (confirm("Start a new session? This will clear current history.")) {
                  void resetSession();
                }
              }}
              title="New Session"
              type="button"
            >
              <ResetIcon />
            </button>
            <Link
              aria-label="Settings"
              className="icon-button"
              href="/settings"
              title="Settings"
            >
              <SettingsIcon />
            </Link>
          </div>
        </header>

        <section
          className="reading-surface swipe-surface"
          onTouchEnd={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onWheel={(event) => {
            event.preventDefault();
            handleWheel(event.deltaY);
          }}
        >
          <div
            className="swipe-track"
            style={{ transform: `translateY(-${pageIndex * 100}%)` }}
          >
            <section className="swipe-page live-page">
              <div className={livePageClassName}>
                {showPausedPair && previousChunk ? (
                  <article className="focused-chunk-panel live-summary-panel previous-summary-panel">
                    <div className="chunk-header">
                      <p className="chunk-meta">{previousChunk.timestamp}</p>
                    </div>
                    <div className="chunk-text-stage">
                      <button
                        aria-label={liveChunkExpanded ? "Show simplified chunk" : "Show full transcript"}
                        className="chunk-action-button"
                        onClick={() => toggleExpandedHistoryChunk(previousChunk.id)}
                        title={
                          expandedHistoryChunkId === previousChunk.id
                            ? "Show simplified chunk"
                            : "Show full transcript"
                        }
                        type="button"
                      >
                        {expandedHistoryChunkId === previousChunk.id ? <ShrinkIcon /> : <ExpandIcon />}
                      </button>
                      <PretextLiveSurface
                        className="focused-chunk-surface"
                        maxFontSize={38}
                        minFontSize={20}
                        placeholder=""
                        text={
                          expandedHistoryChunkId === previousChunk.id
                            ? previousChunk.original
                            : previousChunk.simplified
                        }
                      />
                    </div>
                  </article>
                ) : null}

                {latestChunk ? (
                  <article className="focused-chunk-panel live-summary-panel">
                    <div className="chunk-header">
                      <p className="chunk-meta">{latestChunk.timestamp}</p>
                    </div>
                    <div className="chunk-text-stage">
                      <button
                        aria-label={liveChunkExpanded ? "Show simplified chunk" : "Show full transcript"}
                        className="chunk-action-button"
                        onClick={toggleLiveChunkExpanded}
                        title={liveChunkExpanded ? "Show simplified chunk" : "Show full transcript"}
                        type="button"
                      >
                        {liveChunkExpanded ? <ShrinkIcon /> : <ExpandIcon />}
                      </button>
                      <PretextLiveSurface
                        className="focused-chunk-surface"
                        maxFontSize={42}
                        minFontSize={22}
                        placeholder=""
                        text={
                          liveChunkExpanded
                            ? latestChunk.original
                            : latestChunk.simplified
                        }
                      />
                    </div>
                  </article>
                ) : null}

                {visibleActiveWords ? (
                  <section className="active-canvas live-canvas-panel">
                    <PretextLiveSurface
                      className="live-surface active-live-surface"
                      maxFontSize={56}
                      minFontSize={28}
                      onMetricsChange={handleLiveSurfaceMetricsChange}
                      placeholder=""
                      text={visibleActiveWords}
                    />
                  </section>
                ) : null}
              </div>
            </section>

            {historyPages.map((pageChunks, pageChunksIndex) => {
              const orderedPageChunks = [...pageChunks].reverse();

              return (
                <section className="swipe-page history-page" key={`history-page-${pageChunksIndex}`}>
                  <div className="history-page-stack">
                    {orderedPageChunks.map((chunk) => {
                      const isExpanded = expandedHistoryChunkId === chunk.id;

                      return (
                        <article className="focused-chunk-panel history-chunk-panel" key={chunk.id}>
                          <div className="chunk-header">
                            <p className="chunk-meta">{chunk.timestamp}</p>
                          </div>
                          <div className="chunk-text-stage">
                            <button
                              aria-label={isExpanded ? "Show simplified chunk" : "Show full transcript"}
                              className="chunk-action-button"
                              onClick={() => toggleExpandedHistoryChunk(chunk.id)}
                              title={isExpanded ? "Show simplified chunk" : "Show full transcript"}
                              type="button"
                            >
                              {isExpanded ? <ShrinkIcon /> : <ExpandIcon />}
                            </button>
                            <PretextLiveSurface
                              className="history-focused-surface"
                              maxFontSize={42}
                              minFontSize={22}
                              placeholder=""
                              text={isExpanded ? chunk.original : chunk.simplified}
                            />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <div className="page-dots" aria-hidden="true">
              {Array.from({ length: totalPages }, (_, index) => (
                <span
                  className={index === pageIndex ? "page-dot active" : "page-dot"}
                  key={index}
                />
              ))}
            </div>
          ) : null}
        </section>

        <footer className="composer-area">
          {replySuggestions.length > 0 ? (
            <div className="reply-bubble-row" role="list" aria-label="AI-generated reply suggestions">
              {replySuggestions.map((reply) => (
                <button
                  className={speakingReplyId === reply.id ? "reply-bubble active" : "reply-bubble"}
                  key={reply.id}
                  onClick={() => {
                    void speakReply(reply);
                  }}
                  type="button"
                >
                  {reply.text}
                </button>
              ))}
            </div>
          ) : null}

          <div className="composer-form">
            <div className="composer-row-container relative min-h-[64px] flex items-center justify-center">
              {/* Buttons: Managed via Vanilla CSS for reliable high-speed hiding */}
              <div className={showMessageInput ? "composer-row control-row centered-controls hidden-controls" : "composer-row control-row centered-controls"}>
                <button
                  aria-label={isListening ? "Stop microphone" : "Start microphone"}
                  className={isListening ? "secondary-button mic-toggle active" : "secondary-button mic-toggle"}
                  disabled={!isMicrophoneSupported && !isListening}
                  onPointerDown={(e) => {
                    e.preventDefault(); 
                    void toggleMicrophone();
                  }}
                  title={isListening ? "Stop microphone" : "Start microphone"}
                  type="button"
                >
                  <MicrophoneIcon />
                </button>
                
                <button
                  aria-label="Activate keyboard"
                  className="secondary-button mic-toggle"
                  onPointerDown={(e) => {
                    // Critical: Focus input BEFORE state change to ensure synchronous keyboard trigger
                    e.preventDefault();
                    keyboardInputRef.current?.focus();
                    setShowMessageInput(true);
                  }}
                  title="Pop up keyboard"
                  type="button"
                >
                  <KeyboardIcon />
                </button>
              </div>

              {/* Phantom Footer Input: Always present for zero-latency focus */}
              <div 
                className={`floating-text-container ${showMessageInput ? "active" : ""}`}
                style={showMessageInput ? { bottom: `${viewportBottom + 12}px` } : {}}
              >
                <div className="relative flex-1 flex justify-center px-6">
                  <input
                    ref={keyboardInputRef}
                    autoComplete="off"
                    className="floating-input"
                    onFocus={() => setShowMessageInput(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        if (document.activeElement !== keyboardInputRef.current) {
                          setShowMessageInput(false);
                          setComposerValue("");
                        }
                      }, 120);
                    }}
                    onChange={(event) => setComposerValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        const val = composerValue.trim();
                        if (val) {
                          // DIRECT Synchronous TTS Call for Mobile Context
                          void speakText(val);
                          void submitComposer();
                        }
                        setShowMessageInput(false);
                        keyboardInputRef.current?.blur();
                      } else if (event.key === "Escape") {
                        setShowMessageInput(false);
                        keyboardInputRef.current?.blur();
                      }
                    }}
                    placeholder="Type to speak..."
                    type="text"
                    value={composerValue}
                  />
                </div>
              </div>
            </div>
          </div>
        </footer>

        <ContextAnswerSheet answer={answer} onDismiss={dismissAnswer} />
      </section>
    </main>
  );
}
