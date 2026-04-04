# Vera Figma Wireframe Build Brief

## Purpose

This document translates the Vera UI specification into a Figma-ready wireframe build plan.

It is intended for:

- Figma generation workflows
- manual wireframe construction
- future `use_figma` automation once the skill is available in-session

This brief should be used together with [UI_SCREENS.md](/Users/gopikrishnansasikumar/projects/Accessibility-AI/vera/docs/UI_SCREENS.md).

## Product Summary

Vera is not a generic running-caption viewer.

The UI should begin with a focused live reading surface that defaults to one simplified chunk at a time. In parallel, chunk detection and simplification happen in the background. When a chunk is complete and the simplified version is ready, the focused live page should update that single simplified reading surface. A separate full-caption mode should show a simple scrollable transcript with the active running caption inline. Older history should move into separate swipe pages.

This interaction should be designed with a `Pretext`-style rendering model in mind:

- deterministic text measurement
- canvas-friendly line layout
- stable line wrapping
- adaptive type sizing as the active surface fills

The core interaction model is:

1. the default live page shows one focused simplified chunk as the primary reading surface
2. chunk detection and simplification run in the background during the live render
3. the simplified reading surface uses `Pretext`-style measurement so text stays large and stable
4. the user can reveal the full text for the focused simplified chunk in place
5. a compact icon control in the bottom action row switches into a full-caption mode
6. the full-caption mode is a simple scrollable transcript with the active running caption inline
7. the active running-caption region can still use `Pretext`-style layout, but the past transcript history should remain plain and scrollable
8. older simplified chunks move into swipe-only history pages
9. the bottom input can be used either for TTS replies or to ask questions about the conversation
10. when reply assistance is available, AI-generated reply bubbles should appear only after the system decides the latest chunk actually invites a response
11. tapping a reply bubble should immediately speak it aloud
12. if the input is classified as a question, the answer appears in a compact overlay without interrupting the live flow

## Design Constraints

- mobile-first wireframes
- warm light palette
- no dashboard composition
- no decorative hero blocks
- no glassmorphism
- no pill-heavy controls
- no explanatory system banners about what Vera is doing
- no website-style scrolling transcript behavior
- reading surface should dominate each screen
- controls should be minimal and predictable

## Uncodixfy Constraints

Use this brief as a guardrail against generic AI-generated UI.

The screens should feel like a disciplined product UI, not a concept mockup.

Prioritize:

- plain structure
- strong readability
- restrained spacing
- clean alignment
- subtle borders
- normal controls
- quiet visual hierarchy

Do not let Stitch introduce:

- hero sections inside the product UI
- decorative copy blocks or editorial intro panels
- floating detached shells
- big soft shadows
- glowing cards
- glass panels
- oversized radii
- pill buttons as the default control shape
- decorative status chips
- fake premium gradients
- blue-heavy SaaS styling
- chat bubble styling for finalized chunks
- ornamental labels such as `Live Pulse`, `Conversation Engine`, or `AI Active`

If a screen element feels like decoration rather than utility, remove it.

## Visual Direction

The visual language should be calm, warm, and product-like.

Use the Vera palette direction from the product docs:

- background: `#faf8f5`
- surface: `#ffffff`
- border: `#d9d4cc`
- primary text: `#1f1a17`
- secondary text: `#5f564f`
- accent: `#b45309`
- assistive highlight: `#1f7668`

The palette should stay warm and neutral.

Avoid:

- cool blue dominance
- purple accents
- multicolor gradients
- tinted glass backgrounds
- decorative color overlays

## Layout And Component Rules

Keep the interface normal.

- use simple stacked mobile composition
- use consistent spacing in a tight 8/12/16/20/24 rhythm
- use 1px borders for separation where needed
- keep corner radii modest, generally `8px` to `10px`
- keep shadows extremely light or omit them entirely
- keep buttons rectangular or softly rounded, never pill-shaped by default
- keep labels straightforward and sentence-case
- use standard input styling with visible borders
- keep chunk history aligned to the same reading column as the live canvas

Avoid:

- asymmetrical layouts for visual drama
- detached side panels
- oversized empty margins
- multiple nested card types
- decorative dividers or ornamental icon containers
- floating action clusters

## Typography Rules

Typography should do the work.

- use a plain, readable sans-serif
- avoid decorative font pairings
- avoid condensed display styles
- avoid uppercase eyebrow labels
- avoid gradient or stylized headings
- keep body text practical and high-contrast
- let the live canvas carry emphasis through size and space, not decoration

For the live canvas:

- the first words should feel large and immediate
- scaling down should feel smooth and intentional
- line breaks should remain stable
- do not add decorative emphasis styling just to make the canvas feel dynamic

## Figma File Structure

Create one Figma page:

- `Vera Wireframes`

Create one section inside that page:

- `Core Reading Flow`

Create the following top-level mobile frames inside the section:

1. `01 Setup`
2. `02 Live Stream Start`
3. `03 Live Stream Dense`
4. `04 Simplified Chunk Settles`
5. `05 Full Transcript Expand`
6. `06 Question Answer Overlay`

Use iPhone-sized portrait frames for all screens.

Suggested frame size:

- `390 x 844`

## Global Layout Rules

Every frame should use the same macro structure:

1. top utility bar
2. primary reading surface
3. bottom unified input

### Top utility bar

Keep this compact.

Include only:

- `Vera`
- connection state
- language
- optional subtle settings icon

Do not include:

- mode tabs
- large pills
- AI status narration
- transcript/debug controls
- multiple secondary buttons
- decorative badges
- floating counters
- oversized brand treatment

### Primary reading surface

This is the dominant part of the screen.

It should:

- occupy most vertical space
- center the user on two focused reading regions at most: the active utterance and the latest finalized chunk
- feel like a calm reading surface rather than a dashboard
- support a live word-by-word canvas and one large focused finalized chunk
- place older chunk history below the fold so it appears only after the user swipes down and scrolls
- avoid decorative chat bubbles, heavy cards, or feed-style transcript rows

### Bottom unified input

Include:

- horizontally scrollable reply bubble row when suggestions are available
- text field
- send button

Placeholder copy should imply both intents without adding extra controls.

Suggested placeholder:

- `Type a reply or ask a question`

Do not add:

- separate tabs for `Reply` and `Ask`
- segmented intent toggles
- chatbot composer layout
- glowing send buttons
- attachment bars unless functionally required
- decorative helper chips above the input

## Screen Specs

## 01 Setup

### Goal

Get the user into the live experience quickly.

### Required elements

- Vera wordmark
- one short purpose sentence
- microphone permission block
- language selector
- starter readability preference
- starter pace preference
- primary `Start` button

### Suggested node structure

- `Frame / 01 Setup`
  - `TopSafeArea`
  - `HeaderGroup`
    - `Wordmark`
    - `PurposeText`
  - `SetupStack`
    - `MicPermission`
    - `LanguageField`
    - `ReadabilityField`
    - `PaceField`
  - `BottomAction`
    - `StartButton`

### Notes

- this should feel brief and practical
- no onboarding carousel
- no feature marketing blocks
- no oversized welcome treatment
- no decorative illustration required for balance

## 02 Live Stream Start

### Goal

Show the beginning of a live utterance as words appear on the reading canvas.

### Required elements

- compact top utility bar
- dominant focused reading surface
- very large early-stage type
- bottom unified input

### Behavior represented by this wireframe

- speech is arriving live
- words appear one by one on the active canvas
- type starts large because little text is on screen
- no finalized simplified chunk has been committed yet

### Suggested node structure

- `Frame / 02 Live Stream Start`
  - `TopBar`
    - `AppName`
    - `ConnectionState`
    - `Language`
  - `ReadingSurface`
    - `FocusedSimplifiedChunk`
    - `ActiveCanvas`
      - `LiveChunkMeta`
      - `LiveWordFlow`
  - `BottomInputBar`
    - `InputField`
    - `SendButton`

### Notes

- `LiveChunkMeta` should stay very subtle
- the first two to six words should feel visually dominant
- no cards inside the reading area unless absolutely necessary
- the live canvas should feel embedded in the screen, not mounted in a floating panel

## 03 Live Stream Dense

### Goal

Represent the same live utterance after more words have accumulated and the canvas has adapted.

### Required elements

- same structure as `02 Live Stream Start`
- visibly denser text block
- smaller type than `02` while still remaining highly readable

### Behavior represented by this wireframe

- the active utterance is still streaming
- the font has scaled down to preserve fit as the screen fills
- line breaks should remain stable and intentional
- this should feel like adaptive reading, not text shrinking chaotically

### Suggested node structure

- `Frame / 03 Live Stream Dense`
  - clone of `02 Live Stream Start`
  - update `LiveWordFlow`
  - reduce active type size
  - optional internal annotation showing `Pretext`-style measured layout

### Notes

- if prototyping in Figma, use a subtle smart-animate text scale and reflow between `02` and `03`
- the final product should feel measured and stable, not jittery
- avoid showing clever motion artifacts that call attention to the animation

## 04 Simplified Chunk Settles

### Goal

Show the moment when the live utterance is replaced by the finalized simplified chunk and committed to history.

### Required elements

- same top utility bar
- one newly finalized simplified chunk
- compact affordance to reveal the original text in place
- bottom unified input remains available

### Behavior represented by this wireframe

- the live word-by-word canvas has just been replaced by the simplified version
- the simplified chunk remains in a large focused reading position
- older finalized chunks move into swipe-only history
- the screen remains a single focused reading surface rather than a stacked two-section layout
- this should feel like conversational continuity, not a page swipe

### Suggested node structure

- `Frame / 04 Simplified Chunk Settles`
  - `TopBar`
  - `ReadingSurface`
    - `FocusedChunk`
      - `ChunkMeta`
      - `RevealOriginalButton`
      - `SimplifiedChunkText`
  - `BottomInputBar`

### Notes

- keep the reveal-original affordance small and secondary
- do not visually shrink the simplified chunk into a small history row
- the focused chunk should use `Pretext`-style sizing so it stays large and readable
- the settled chunk should not look like a message bubble
- history should live outside the live page, not below the fold

## 05 Full Transcript Expand

### Goal

Reveal the original full transcription for one finalized simplified chunk inside the conversation flow.

### Required elements

- same base frame
- visible association to the selected previous chunk
- original transcription text
- clear close/back affordance

### Behavior represented by this wireframe

- this is not a global transcript screen
- it is a focused reveal for one chunk only
- the expanded full transcript should still occupy a large readable slot sized with `Pretext`

### Suggested node structure

- `Frame / 05 Full Transcript Expand`
  - `TopBar`
  - `ReadingSurface`
    - `SettledChunkStack`
      - `ExpandedChunkItem`
        - `ChunkMeta`
        - `BackToSimplified`
        - `FullTranscriptText`
    - `ActiveCanvas`
  - `BottomInputBar`

### Notes

- keep this tied to the previous chunk context
- avoid turning this into a scrolling archive view
- avoid modal theatrics or full takeover styling
- keep the focused full transcript large enough to read before the user chooses to move into older history

## 06 Question Answer Overlay

### Goal

Show a question answer without interrupting the active chunk surface.

### Required elements

- active live canvas or settled chunk stack still visible underneath
- compact overlay sheet
- concise answer
- optional supporting lines
- dismiss affordance

### Behavior represented by this wireframe

- user input is classified by an agent
- if the input is a question, the answer appears here
- the answer should not replace the current chunk page

### Suggested node structure

- `Frame / 06 Question Answer Overlay`
  - `BaseLayer`
    - clone of `04 Simplified Chunk Settles`
  - `AnswerSheet`
    - `AnswerTitle`
    - `AnswerBody`
    - `OptionalSupportingPoints`
    - `DismissControl`

### Notes

- this should feel like a compact mobile sheet
- not a chatbot
- not a full-screen takeover
- the overlay should look like a normal product sheet, not a floating glass card

## Stitch Generation Notes

When this brief is used in Stitch:

- generate normal product screens, not showcase shots
- prefer a restrained product UI over a visually expressive concept
- keep the screen centered on reading, not branding
- use visual hierarchy through spacing, contrast, and type size rather than decoration
- ensure the live canvas, settled chunk stack, and bottom input all align to one coherent reading column
- preserve room for real text, not placeholder ornament

## Interaction Notes For Prototyping

- `01 Setup` -> `02 Live Chunk`
  - tap `Start`

- `02 Live Stream Start` -> `03 Live Stream Dense`
  - automatic as more words arrive
  - smooth type reduction and line growth

- `03 Live Stream Dense` -> `04 Simplified Chunk Settles`
  - automatic when chunk detection and simplification complete
  - active text is replaced, and the newest simplified chunk stays in focused view while older history moves into swipe pages

- `04 Simplified Chunk Settles` -> `05 Full Transcript Expand`
  - tap reveal original

- `05 Full Transcript Expand` -> `04 Simplified Chunk Settles`
  - tap back

- `04 Simplified Chunk Settles` -> `06 Question Answer Overlay`
  - tap send after entering a question

- `04 Simplified Chunk Settles`
  - tap a reply bubble to speak it aloud immediately

- `06 Question Answer Overlay` -> `04 Simplified Chunk Settles`
  - dismiss overlay

## Copy Guidance

Use short, plain language.

Prefer:

- `Live`
- `English`
- `Show original`
- `Start`
- `Type a reply or ask a question`

Avoid:

- `Vera is analyzing`
- `AI is simplifying`
- `Processing transcription`
- `Adaptive mode active`
- `Assistive rendering selected`

## Wireframe Content Samples

Use content that looks like real simplified conversation, not lorem ipsum.

Example live streaming text:

`The doctor will review the results today and explain`

Example simplified chunk:

`The doctor will review the results today and explain the next steps after lunch.`

Example previous chunk:

`Your appointment was moved to tomorrow morning because the lab needs more time.`

Example full transcript chunk:

`Your appointment has been moved to tomorrow morning because the lab said they need a little more time before they can send everything over.`

Example answer overlay:

`Your appointment is tomorrow morning.`

Supporting line:

`The change happened because the lab needs more time.`

## Build Priorities

If time is limited, build in this order:

1. `02 Live Stream Start`
2. `03 Live Stream Dense`
3. `04 Simplified Chunk Settles`
4. `05 Full Transcript Expand`
4. `06 Question Answer Overlay`
5. `01 Setup`
6. refine motion between `03` and `04`

## Success Criteria

The wireframes are correct if:

- the main screen starts with live word-by-word text on a dominant canvas
- active type becomes smaller as the current utterance consumes more of the screen
- finalized chunks replace the active canvas only after chunk detection and simplification
- the focused viewport shows one simplified reading surface at a time
- older history lives in swipe-only pages instead of crowding the main reading area
- reveal original exists only as a chunk-specific in-place affordance
- the focused simplified state remains large and readable, while the full-caption mode stays plain and scrollable except for the active live region
- the question answer appears as a secondary overlay
- the interface feels like a calm live reader, not a transcript dashboard or generic chat app
