# Vera UI Screens

## Purpose

This document defines the primary user-facing screens for Vera and provides a design direction that is ready for implementation or input into a UI generation tool such as Stitch.

The screen system is designed for:

- low cognitive load
- strong readability
- stable caption rendering
- fast reply workflows
- clear accessibility behavior

## Design Direction

### Product character

Vera should feel:

- calm
- legible
- trustworthy
- practical
- non-clinical

It should not look like a generic AI dashboard or a decorative startup landing page.

### Visual principles

- typography must prioritize reading speed over visual flair
- actions should remain close to the content they affect
- the live conversation screen should minimize navigation friction
- the transformed caption should always feel primary
- original text should remain accessible without competing visually

### UI guardrails

- use normal product UI patterns rather than experimental or decorative compositions
- avoid dashboard hero strips, eyebrow labels, decorative copy blocks, and glassmorphism
- avoid oversized radii, pill overload, floating shells, dramatic shadows, and gradient-heavy styling
- prefer plain headers, simple toolbars, standard inputs, and compact buttons
- keep borders subtle and shadows minimal
- do not spend space on ornamental notes explaining what the interface is doing
- favor predictable structure over creative asymmetry

### Color direction

Use a quiet light palette with strong text contrast and selective warm emphasis.

Suggested base palette:

- background: `#faf8f5`
- surface: `#ffffff`
- border: `#d9d4cc`
- primary text: `#1f1a17`
- secondary text: `#5f564f`
- accent: `#b45309`
- assistive highlight: `#1f7668`
- warning: `#b42318`

The palette should stay warm and calm. Avoid cool blue dominance.

### Component direction

- buttons should be standard rectangular or softly rounded controls, not pills
- cards should be used sparingly and only when they clarify grouping
- tabs should be simple if needed, but the main Vera flow should avoid unnecessary segmented controls
- overlays should feel like normal sheets or side panels, not floating glass panels
- the bottom input should look like a normal product input with clear borders and labels

## Screen Inventory

The MVP should include these screens:

1. launch and permission screen
2. live conversation screen
3. stanza history view
4. contextual answer overlay
5. session review screen
6. personalization and accessibility screen

## Screen Flow

```mermaid
flowchart LR
    A["Launch & Permissions"] --> B["Live Conversation"]
    B --> C["Previous Chunk View"]
    B --> D["Contextual Answer Overlay"]
    B --> E["Session Review"]
    B --> F["Personalization & Accessibility"]
    E --> B
    F --> B
```

## 1. Launch And Permission Screen

### Purpose

Help the user quickly:

- understand what Vera does
- grant microphone access
- choose language and baseline accessibility preferences
- enter the live conversation flow

### Layout

```mermaid
flowchart TB
    H["Vera wordmark"] --> P["Short purpose statement"]
    P --> M["Microphone permission panel"]
    M --> L["Language selector"]
    L --> R["Reading support starter choices"]
    R --> S["Start conversation button"]
```

### Key elements

- plain language value statement
- microphone permission button
- default language selector
- starter text size or readability preference
- starter pace preference
- start button

### Notes

- no long onboarding carousel
- no decorative illustrations that compete with comprehension
- this screen should be functional and brief
- avoid marketing-style intro copy

## 2. Live Conversation Screen

### Purpose

This is the core product surface. The user should be able to understand speech, react quickly, and stay oriented without jumping between multiple UI areas.

### Layout

```mermaid
flowchart TB
    TOP["Top utility bar"] --> BODY["Conversation area"]
    BODY --> FOOT["Unified input bar"]

    subgraph BODY["Conversation area"]
      PAGE0["Live page"]
      PAGE1["Swipe-up history pages"]
    end

    subgraph PAGE0["Live page"]
      LAST["Latest simplified chunk"]
      ACTIVE["Active live canvas"]
    end

    subgraph PAGE1["Swipe-up history pages"]
      PRIOR["One prior chunk per page"]
    end

    subgraph FOOT["Unified input bar"]
      INPUT["Text input"]
      SEND["Send / Ask"]
    end
```

### Top utility bar

- session title
- connection status
- current language
- quick access to personalization
- optional access to session review

### Active conversation behavior

This is the most important UI surface.

The screen should behave as follows:

- show the active utterance word by word on a dominant canvas as speech arrives
- start with large type for early words, then reduce type size smoothly as the active utterance occupies more vertical space
- use deterministic text measurement and line layout so reflow feels stable rather than jittery
- run chunk detection and simplification fully in the background during the live render
- once a paragraph or chunk is complete and simplification is ready, replace the active live text with the selected simplified chunk
- show only two focused text regions in the main viewport: the active live utterance and the most recent finalized simplified chunk
- place the most recent finalized chunk above the active transcription like a calm two-part conversation view
- keep that most recent finalized chunk large enough to read, not compressed into a small history row
- reveal older finalized chunks only after the user swipes upward into a separate history page flow
- show just one prior chunk per history page rather than a scrolling stack
- use `Pretext` not only for the active live canvas, but also for whichever chunk is currently focused for reading
- preserve a calm, nearly full-screen reading surface with minimal chrome
- keep only subtle system indicators when absolutely necessary, such as connection state
- avoid extra chips, helper text, banners, empty waiting cards, or explanation blocks in the active reading area
- the screen should feel like a focused reader, not a live transcript monitor or generic chat feed

### Unified input bar

- anchored at the bottom
- can show one AI-generated reply bubble directly above the input for the most recently captured chunk
- that bubble should appear after a short delay once the chunk is captured
- tapping a reply bubble should trigger spoken playback immediately
- accepts typed replies for TTS
- also accepts typed questions about the current conversation
- uses the same field for both intents
- intent routing should be automatic

## 3. Finalized Chunk Stack And Transcript Reveal

### Purpose

Allow the user to review prior finalized simplified chunks without disrupting the active live canvas.

### Behavior

- the primary live viewport should show the active live canvas and only the most recent finalized chunk
- older finalized chunks should remain available through separate swipe pages in chronological order
- reaching older history should require upward swipe navigation rather than scrolling
- the currently focused finalized chunk should primarily show the simplified version
- the focused finalized chunk should include a compact button to reveal the full transcription chunk for that specific segment
- transcript reveal should happen in place for the focused chunk, not as a separate archive screen
- when full transcript is shown, that focused chunk should still be laid out at a large readable size using `Pretext`
- the history experience should feel like app paging, not a decorative chat bubble list or scrolling transcript

### Contents

- simplified chunk text
- timestamp or relative order
- compact `Show Full` affordance for the original transcription chunk

## 4. Contextual Answer Overlay

### Purpose

Display answers to user questions about the ongoing conversation without interrupting transcription.

### Behavior

- opens as a secondary overlay, sheet, or sidecar
- must not replace or block the active live canvas
- should be compact, readable, and dismissible
- should preserve the live conversation view underneath
- should look like a normal product sheet with straightforward spacing and controls

### Contents

- concise answer
- optional supporting points
- clear separation from the live caption flow

## 5. Session Review Screen

### Purpose

Allow saved conversation review without turning the app into a cluttered transcript archive.

### Layout

```mermaid
flowchart TB
    H["Session header"] --> L["Conversation timeline"]
    L --> F["Filter and export actions"]
```

### Timeline design

Each timeline item should show:

- time
- speaker
- transformed caption
- optional original text access
- reply events

### Filters

- show only transformed captions
- show original and transformed
- show only user replies

## 6. Personalization And Accessibility Screen

### Purpose

Let the user shape Vera around their reading and communication needs while keeping real-time adaptation agentic.

### Layout

```mermaid
flowchart TB
    A["Reading profile"] --> B["Visual accessibility goals"]
    B --> C["Language settings"]
    C --> D["Reply voice settings"]
```

### Sections

#### Reading profile

- reading pace target
- desired amount of simplification
- show original availability toggle
- low confidence warning toggle

#### Visual accessibility goals

- text size
- density preference
- high contrast mode
- emphasis strength preference

#### Language settings

- preferred language
- multilingual preservation toggle
- mixed-language preference

#### Reply settings

- default tone
- TTS voice
- preview speed

## Primary Screen States

The live conversation screen must support these states cleanly:

- waiting for permission
- listening
- receiving streaming word-by-word transcript
- active canvas at large type
- active canvas compacted to smaller type
- paragraph boundary detected
- simplified stanza committed to focused last-chunk slot
- user expanding a prior chunk transcript
- user swiping between live and history pages
- contextual answer overlay open
- low confidence
- offline or reconnecting
- text input composing
- reply speaking

## Mobile Behavior

### Mobile rules

- live caption stream stays primary
- the active live canvas should occupy almost the full screen when the current utterance begins
- the last finalized chunk should remain in the focused viewport and stay large enough to read comfortably
- older history should be reached through vertical swiping, not scrolling
- contextual answers should appear in a non-blocking overlay
- the bottom input should always remain reachable

### Avoid

- tiny floating controls
- sidebars
- overly dense toolbars
- decorative overlays
- dashboard cards stacked inside the live screen
- explanatory helper paragraphs inside the active reading surface

## Accessibility Notes

- transformed caption text should be visually dominant
- active streaming text should remain highly legible throughout its size transitions
- minimum hit targets should be comfortable
- key actions must be reachable with one hand on mobile
- visual state changes must not depend on color alone
- layout should remain stable during rapid updates
- typography scaling should be smooth, deterministic, and free from sudden jumps

## Stitch-Ready Prompt

Use this prompt as a starting point in a UI generation workflow:

```text
Design a calm, accessibility-first web and mobile interface for a product called Vera, a real-time assistive communication app for deaf and hard-of-hearing users. The main screen should show streaming captions full-screen word by word as speech arrives on a dedicated live canvas. The first words should appear very large, then the type should scale down smoothly as the active utterance consumes more of the screen, with stable measured line wrapping. When a paragraph or stanza is complete and simplification finishes, keep only two chunks on the live page: the most recent finalized simplified chunk on top and the active live transcription beneath it. That finalized chunk should remain large enough to read comfortably, not compressed into a small history card. Older chunk history should not scroll in a feed. Instead, the user should swipe upward into separate app-like history pages, with one prior chunk per page. Each focused finalized chunk should have a compact button to show the full version in place, and both the simplified and full-transcript focused states should use `Pretext`-style measured layout to stay large and readable. Above the bottom input, show AI-generated potential reply bubbles in one horizontal scroll row; tapping a bubble should immediately speak that reply aloud. A single bottom text box should still support both TTS replies and typed questions about the active conversation. An AI agent should route the input intent automatically to either reply playback or contextual search. Search answers must appear in a secondary overlay or sidecar that does not disturb the live transcription surface. Prioritize strong readability, low cognitive load, stable text layout, app-like paging, and minimal chrome. Use normal product UI patterns: simple headers, compact controls, standard inputs, restrained borders, minimal shadows, and straightforward sheets. Avoid generic AI dashboard aesthetics, hero sections, eyebrow labels, decorative copy blocks, glowing cards, oversized rounded corners, pill-heavy controls, floating glass panels, decorative charts, and cool blue dominant palettes. Use a quiet warm light palette, strong contrast, restrained borders, and practical typography. Also design screens for launch and permissions, session review, and personalization settings focused on reading pace goals, density goals, language, visual accessibility, and TTS settings.
```

## Implementation Guidance

If these screens are implemented in code, start with:

- a single live conversation screen
- a `Pretext`-backed live canvas renderer
- a focused last-chunk reader plus swipe-only history pages
- a non-blocking answer overlay
- a unified bottom input
- a compact personalization drawer

The screen system should grow from the live experience outward, not from a dashboard shell inward.
