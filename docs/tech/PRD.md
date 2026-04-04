# Vera Product Requirements Document

## 1. Overview

Vera is a real-time assistive communication application for deaf and hard-of-hearing people. It listens to live speech, transforms it into highly readable text under visual constraints, and helps the user respond more easily through typed or assisted speech output.

Unlike a conventional captioning app, Vera is designed as a readability optimization system. Its purpose is not only to transcribe speech accurately, but to present meaning in a form that is easier to read quickly, with less cognitive strain, less eye movement, and better conversation continuity.

## 2. Vision

Enable deaf and hard-of-hearing users to participate in natural, in-person conversation with less delay, less fatigue, and more confidence.

## 3. Product Thesis

The core challenge is not just speech-to-text conversion. The real challenge is delivering maximum meaning in minimum readable space under real-time conversational pressure.

Vera treats communication as a pipeline:

```text
Audio -> Streaming Transcript -> Paragraph Detection -> Meaning Transformation -> Layout Evaluation -> Caption Replacement -> User Response / Search
```

This means Vera is an adaptive readability system, not just a transcription interface.

## 4. Research Foundation

Vera is grounded in co-design workshop findings from the Sunva project with Deaf, Hard-of-Hearing, and speech-irregularity participants.

The most important signals from that research were:

- users strongly valued text simplification
- users strongly valued control over live caption speed
- multilingual and mixed-language support matter in real usage
- responding is still difficult even when captioning works well
- multi-speaker conversations are hard to follow without speaker identification
- captions can be technically accurate but still misleading or cognitively hard to process

These findings validate Vera's core direction as a comprehension-first and response-aware communication tool.

## 5. Problem Statement

Deaf and hard-of-hearing users face several barriers during live spoken conversations:

- Raw transcripts are often too dense or too long to read in time.
- Real-time captions can reflow unpredictably, causing visual instability.
- Important information is not always visually prioritized.
- Typing a response can be slow, especially for users with speech or language production challenges.
- Existing tools optimize for transcription accuracy, not for comprehension speed or accessibility.
- Caption pace may be too fast for the user's reading bandwidth.
- Multilingual and mixed-language conversation often breaks conventional systems.
- Multi-speaker conversations create confusion without identity cues.

## 6. Goals

### Primary goals

- Deliver low-latency live captions for in-person communication.
- Improve readability of spoken content in real time.
- Reduce cognitive load and visual instability.
- Help users respond faster with assisted text-to-speech.
- Let the system adapt caption density, emphasis, and presentation to the user's reading needs in real time.

### Secondary goals

- Support multiple assistive rendering strategies chosen automatically from context.
- Personalize readability based on reading speed, language, and device constraints.
- Persist sessions for later review and product improvement.
- Build toward multilingual and multi-speaker support.

## 7. Non-Goals for MVP

- Full meeting transcription for long-form archival use.
- General-purpose AI assistant features unrelated to communication accessibility.
- Open-ended autonomous agents with broad tool access.
- Complex multi-user collaboration features.
- Full cross-platform native apps on day one.
- Perfect multi-speaker diarization or full multilingual parity in the first release.

## 8. Target Users

### Primary users

- Deaf users communicating in live in-person settings.
- Hard-of-hearing users who benefit from adaptive captions.
- Users who prefer simplified or visually stable text over raw verbatim transcription.
- Users who need support producing spoken replies through typed input and TTS.

### Secondary users

- Communication partners of deaf users.
- Accessibility facilitators, educators, and interpreters.
- Families and caregivers supporting daily communication.

## 9. Core User Needs

Users need to:

- understand spoken language quickly,
- keep their eyes on the conversation with minimal distraction,
- trust that important meaning is preserved,
- choose how much simplification they want,
- control or adapt the pace of captions to their reading ability,
- respond without needing to type full polished sentences,
- use the product in multilingual and mixed-language settings,
- experience a stable, predictable interface during live interaction.

## 10. Key Product Principles

- Accessibility first: optimize for comprehension, not feature count.
- Low latency over cleverness: real-time conversation must feel responsive.
- Stable visual presentation over flashy interactions.
- Assistive agency: the system helps the user communicate, but does not take control away.
- Deterministic rendering where possible: layout should be measured, not guessed.
- User control over transformation: users should be able to compare or choose transformed outputs where needed.
- Human dignity: outputs should avoid sounding infantilizing, overly robotic, or reductive.

## 11. Core Product Experience

A user opens Vera and starts a live conversation.

The system captures incoming speech, renders streaming captions full-screen as words arrive, detects paragraph or stanza boundaries, and then replaces the active streaming text with the best simplified version for that completed chunk.

The live surface should use deterministic text measurement and layout so the interface can start with large type, reduce type size smoothly as the utterance grows, and preserve stable wrapping during rapid updates. A `Pretext`-backed layout engine is the current recommended implementation for this behavior.

The user can:

- read finalized simplified chunks in the primary reading surface by default,
- use a compact top-level button to switch to the full version when needed,
- switch back to simplified text without changing the surrounding page structure,
- see in-progress live speech only when the full-version state is active,
- swipe upward into a separate chunk-history page flow rather than scrolling through a feed,
- type into a single bottom input that supports either reply playback or contextual question answering,
- receive search answers without interrupting the active reading surface,
- play typed replies back using text-to-speech.

The interface should preserve a sense of conversation flow instead of feeling like a transcript dump.

### 11.1 Assistive decision model

Vera should treat each transcription chunk as a comprehension decision problem.

For every chunk, the system should determine:

- whether the chunk is already understandable as-is
- what makes the chunk hard to understand
- what assistive action will help most without losing meaning
- what should be shown immediately versus made available on demand

The goal is not to summarize by default. The goal is to make each chunk understandable for a deaf user in context.

## 12. Core Features

### 12.1 Live speech captioning

- Capture microphone audio in real time.
- Stream speech recognition with low latency.
- Segment user turns clearly.
- Support speaker-aware rendering when feasible.
- Render in-progress speech as full-screen streaming text during the active utterance.
- Support canvas-based text rendering with deterministic measurement and stable line layout.
- Allow the active type size to adapt downward as the current utterance consumes more space.

### 12.2 Assistive chunk understanding

The system must inspect each transcription chunk and determine what kind of assistive help is needed.

Possible chunk problems include:

- dense or formal language
- filler or noise clutter
- too much information for the current reading pace
- misleading transcript wording
- multilingual or mixed-language phrasing
- difficult terms requiring explanation
- low-confidence speech recognition

Possible assistive actions include:

- keep verbatim
- clean transcript
- simplify language
- compress for speed
- highlight key information
- repair misleading text
- preserve mixed-language phrasing
- attach explanation on demand
- mark low confidence or fall back safely

### 12.3 Adaptive caption transformation and caption mode switch

- Generate multiple candidate caption forms from the same utterance.
- Support at minimum candidates corresponding to:
  - direct verbatim rendering,
  - readability simplification,
  - compressed urgent rendering.
- Choose the best candidate automatically for the available layout, comprehension context, and user profile.
- Commit finalized chunks into history with both an original transcript form and a selected simplified form.
- Default the interface to simplified rendering.
- Allow a single compact button to switch the interface between the simplified version and the original full version.
- Avoid mixing both versions in the primary reading surface at the same time.

### 12.4 Layout-aware readability optimization

- Evaluate candidate captions against viewport and line constraints before rendering.
- Minimize reflow and jumping lines.
- Prefer captions that preserve meaning while fitting available space.
- Use layout as a scoring and verification layer in the rendering pipeline.
- Keep the active reading view focused on one caption mode at a time.
- Use `Pretext` to size the currently focused chunk, whether simplified or full-transcript, so it remains large enough to read within the available surface.
- Avoid scroll-dependent layouts in the live experience and prefer discrete swipe transitions between chunk views.

### 12.5 Visual emphasis

- Highlight important words or phrases without breaking readability.
- Preserve stable line layout while emphasizing key meaning.
- Avoid decorative styling that increases cognitive load.

### 12.6 Unified response and query input

- Provide a single bottom text input on the live screen.
- Show one AI-generated potential reply as a lightweight bubble above the input for each captured chunk when reply assistance is available.
- Reveal that reply suggestion after a short delay once the chunk has been captured.
- Generate that reply suggestion in parallel with chunk simplification rather than waiting for the full interaction loop to finish.
- Let the user tap the reply bubble to immediately play that reply aloud through TTS.
- Allow the user to type short or incomplete text.
- Let an intent-routing agent determine whether the input is:
  - a spoken reply request for TTS, or
  - a contextual question about the active conversation.
- Generate clearer, more natural speech output for typed reply intents.
- Offer text-to-speech playback in a user-selected voice and language.
- Present search or question-answer results in a sidecar or overlay that does not disturb the active live transcription view.

### 12.7 Personalization

- Store preferred language, reading density targets, pace settings, contrast needs, text size preferences, and voice settings.
- Adapt caption density, timing, emphasis, and visual presentation to the user over time.

### 12.8 Stanza history and session history

- Save structured conversation sessions.
- Maintain settled access to prior simplified stanzas during a live session through swipe-only history pages.
- Keep the live viewport limited to the active utterance and the latest finalized stanza.
- Allow the user to reach older history by swiping into dedicated prior-chunk pages.
- Allow the user to reveal the full transcript for the focused finalized stanza on demand.
- Allow basic review of prior sessions.
- Preserve privacy-sensitive controls around stored content.

### 12.9 Multilingual readiness

- Plan for local language support.
- Support mixed-language conversation in the product roadmap.
- Avoid architecture decisions that assume English-only usage.

## 13. User Experience Requirements

### 13.1 Performance

- Caption updates should feel near real-time.
- The system should prioritize incremental rendering over long pauses.
- New text should not cause large, unpredictable layout jumps.
- Pace controls must not undermine conversation continuity.
- Canvas text measurement and layout must remain fast enough for word-by-word updates.

### 13.2 Readability

- Font sizing and spacing must support low-effort reading.
- The active caption surface should be glanceable and full-screen dominant.
- Visual hierarchy should make key meaning easy to scan.
- Simplification should improve understanding, not erase nuance.
- In-progress streaming text and the latest finalized simplified text may coexist, but older history should live outside the main page and not compete in the main reading area.
- Dynamic type-size changes should feel smooth and intentional rather than abrupt.
- The currently focused finalized chunk should remain large enough for comfortable reading.
- Expanding `Show Full` should preserve a large readable treatment rather than collapsing into transcript-sized body copy.

### 13.3 Control

- Users should be able to reveal the full transcript for a prior finalized stanza when needed.
- Users should be able to guide long-lived readability preferences and accessibility goals without micromanaging each caption.
- The product should avoid intrusive explanation chrome during live conversation.
- Reply assistance should provide options when ambiguity matters.

### 13.4 Safety and respect

- Simplification should not remove critical meaning.
- Sensitive content should not be paraphrased in misleading ways.
- The interface should avoid making the user feel corrected or spoken for.
- TTS rewrites should preserve user intent.

## 14. Functional Requirements

### 14.1 Conversation pipeline

The system must:

- accept live audio input,
- produce streaming transcript updates,
- maintain structured conversation state,
- diagnose chunk-level comprehension problems,
- choose an assistive action per chunk,
- transform utterances into candidate caption variants,
- score or verify those variants against layout constraints,
- render the selected caption variant,
- maintain settled finalized-chunk history,
- support intent-routed reply, search, and speech playback.

### 14.2 Assistive action policy

The system must support a decision policy that treats `assistive_simplified` as a family of transformations rather than a single summarization step.

At minimum, the system should support these chunk-level actions:

- `keep_verbatim`
- `clean_transcript`
- `simplify_language`
- `compress_for_speed`
- `highlight_key_info`
- `repair_misleading_text`
- `preserve_mixed_language`
- `attach_explanation`
- `mark_low_confidence`

The system should prefer the smallest helpful intervention that improves understanding while preserving user trust.

### 14.3 Assistive rendering strategies

The MVP must support internal rendering strategies including:

- `verbatim`: direct transcript with minimal transformation,
- `assistive_simplified`: easier reading while preserving meaning,
- `compressed_urgent`: shortest useful form for fast scanning.

These strategies are primarily agent-selected system behaviors, not primary user-facing tabs. The default experience should be automatic, with only compact access to the full version of prior finalized stanzas when needed.

### 14.4 Pace and density behavior

The system must:

- allow the interface to support controllable goals and adaptive caption pace,
- support layout-aware selection for overflow situations,
- preserve continuity when using condensed caption representations.

### 14.5 Agentic visual accessibility

The system must:

- adapt visual presentation based on user profile, device constraints, and live caption conditions,
- treat text size, spacing, emphasis, and contrast as adaptive rendering parameters rather than purely static UI settings,
- preserve readability when emphasis or highlighting is applied,
- avoid unnecessary visual churn while still responding to context.

### 14.6 Rendering behavior

The system must:

- preserve stable line breaks where feasible,
- avoid excessive re-rendering,
- handle overflow gracefully,
- support emphasis without unsafe HTML injection,
- render in-progress live transcript word by word in a full-screen active surface,
- render that active surface on a deterministic layout engine that can adapt type size as the utterance grows,
- clear or replace that active surface with the finalized simplified stanza after paragraph detection,
- keep only the latest finalized stanza in the focused live viewport,
- keep older prior stanzas accessible through separate swipe pages without interfering with the active caption area,
- allow the focused finalized stanza to switch between simplified and full-transcript views while staying in a large readable layout,
- display contextual search results in a secondary surface that does not block or overwrite the current transcription flow.

### 14.7 Session state

The system must track:

- active room/session,
- current language,
- current rendering strategy,
- reading pace or density targets,
- visual accessibility preferences and inferred presentation state,
- active streaming transcript,
- active canvas typography state,
- active canvas layout measurements,
- current finalized stanza,
- prior stanza history,
- diagnosed chunk problems,
- chosen assistive action,
- recent utterances,
- selected render candidate,
- transformation metadata,
- reply state.

## 15. Technical Direction

### 15.1 Recommended architecture

Vera should be built with:

- LiveKit for real-time audio transport and session infrastructure,
- LangGraph for deterministic orchestration of caption decisions and state,
- a modern frontend for rendering and interaction,
- a `Pretext`-backed layout evaluation and live canvas rendering layer for fit-aware caption selection.

### 15.2 Why LiveKit

LiveKit is the real-time media layer. It should handle:

- audio streaming,
- session transport,
- turn timing,
- speech-related real-time infrastructure.

### 15.3 Why LangGraph

LangGraph is the orchestration layer. It should manage:

- caption transformation decisions,
- stateful conversation flow,
- routing between assistive rendering strategies,
- fallback logic,
- personalization and policy decisions.

### 15.4 Role of layout evaluation

Layout evaluation should not be the main orchestration layer. It should act as a deterministic scoring and verification step that helps the system choose the best caption candidate for the user interface.

## 16. Proposed Runtime Flow

```text
Live audio
  -> speech recognition
  -> `Pretext`-backed streaming word-by-word canvas render
  -> paragraph or stanza detection
  -> candidate caption generation
  -> layout scoring / fit verification
  -> caption selection
  -> active surface replacement with simplified stanza
  -> newest finalized chunk stays in focused view
  -> older history moves into swipe-only prior-chunk pages
  -> optional query sidecar or assisted reply generation
  -> speech playback or search result presentation
```

## 17. Proposed LangGraph Nodes

Initial graph nodes may include:

- `ingest_transcript`
- `segment_utterance`
- `detect_paragraph_boundary`
- `generate_caption_candidates`
- `score_layout_fit`
- `select_rendering_strategy`
- `render_caption_event`
- `route_input_intent`
- `assist_typed_reply`
- `answer_context_query`
- `persist_session_event`

These names are provisional and should be refined during implementation.

## 18. MVP Scope

### In scope

- One end-to-end live conversation flow.
- English-first implementation.
- Streaming captions with word-by-word active canvas rendering.
- Adaptive type-size reduction as the active utterance consumes the viewport.
- Three internal rendering strategies.
- Layout-aware candidate selection.
- Typed reply assistance with TTS.
- Intent-routed contextual search that does not interrupt the live transcription view.
- Basic user preferences.
- Basic saved session support.
- Observability for latency and transform quality.

### Out of scope

- Full multilingual parity.
- Advanced diarization beyond what is needed for readability.
- Deep analytics dashboards.
- Native mobile apps.
- Enterprise deployment features.

## 19. Success Metrics

### User metrics

- Time to understand a spoken utterance.
- User trust in transformed captions versus original inspection behavior.
- Reported comprehension and fatigue.
- Response speed improvement with assisted reply.
- Usage of pace, density, or accessibility preference controls.

### System metrics

- End-to-end caption latency.
- Caption stability score.
- Transformation acceptance rate.
- Overflow or layout failure rate.
- Session crash rate.

## 20. Risks

- Over-transforming captions and losing important meaning.
- Latency increases from multi-step generation loops.
- Layout-aware generation becoming too expensive on the hot path.
- Over-reliance on LLM behavior without sufficient policy constraints.
- Accessibility regressions caused by visually unstable UI changes.
- Pace controls introducing fragmentation in the live conversation experience.

## 21. Risk Mitigations

- Keep the hot path minimal and deterministic.
- Use layout as a scoring layer, not an open-ended loop by default.
- Introduce rule-based compression before expensive regeneration.
- Preserve easy access to original and minimally transformed captions.
- Build tests around transformation policy and rendering stability.
- Validate with real users early and repeatedly.
- Treat pace control as a presentation problem, not as permission to create large buffering delays.

## 22. Open Questions

- What level of automatic intervention should Vera use for first-time users before it has enough personalization data?
- How aggressively should the system simplify in high-speed conversation?
- How should user reading speed be estimated or configured?
- What level of speaker separation is necessary for the MVP?
- Which languages should follow English after the first release?
- How much session data should be stored by default?
- Should reply assistance default to one suggestion or multiple suggestions?

## 23. Phased Delivery Plan

### Phase 1: Foundation

- Set up the new Vera repository and architecture.
- Establish LiveKit session flow.
- Implement LangGraph caption orchestration skeleton.
- Build core frontend shell and event model.

### Phase 2: MVP conversation loop

- Add streaming captions.
- Add caption candidate generation.
- Add layout-aware selection.
- Add stable rendering.
- Add typed reply assistance with TTS.

### Phase 3: Personalization and polish

- Add user preference profiles.
- Improve observability.
- Add saved sessions.
- Tune caption strategies using user feedback.

### Phase 4: Expansion

- Add multilingual and mixed-language support.
- Add multi-speaker support.
- Explore third-party integrations.

## 24. Product Positioning

Vera is a real-time communication aid for deaf and hard-of-hearing users that goes beyond transcription. It transforms spoken language into readable, visually stable, assistive communication.

## 25. Summary

Vera should be built as a low-latency accessibility system that optimizes meaning for human reading under real-world conversation constraints. Its advantage will come not from generic AI features, but from combining speech, language transformation, controllable readability, and deterministic layout-aware rendering into one coherent assistive experience.
