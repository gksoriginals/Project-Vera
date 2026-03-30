# Project Vera (WIP)

Vera is a **fully agentic live captioning and communication platform** designed to empower Deaf and Hard-of-Hearing (DHH) individuals to communicate seamlessly in real-time. Moving beyond conventional transcription, Vera acts as an intelligent intermediary—transforming live speech into highly readable, visually stable stanzas that eliminate cognitive barriers and foster natural, fluid conversation.

---

## 🌟 Key Features

### 📖 Adaptive Readability Transformation
Vera doesn't just transcribe; it processes speech chunks through an **assistive decision model**.
- **Assistive Simplification**: Transforms dense or complex speech into easier-to-read stanzas.
- **Pretext Engine (Layout Intelligence)**: Vera uses a deterministic `Pretext` engine that analyzes physical screen constraints (e.g., active keyboard overrides, `VisualViewport` calculations, and text density/occupancy) in real-time. If the screen becomes crowded, it feeds this "visual pressure" directly into the LangGraph prompt, automatically triggering "compress_for_speed" modes to drastically shorten text and prevent chaotic UI reflows on mobile devices.
- **Visual Stability**: Uses layout-aware styling to minimize jumping lines and unpredictable reflow.
- **Multi-Strategy Rendering**: Automatically chooses between verbatim, simplified, or compressed forms based on the user's chosen pace and the live `Pretext` spatial calculations.

### 🎙️ LiveKit-Powered Real-Time Interaction
- **Word-by-Word Streaming**: Captures live audio and streams transcripts with near-zero latency.
- **Active Transcription Surface**: A full-screen, glanceable interface where text scaling is handled automatically.

### ⌨️ Unified Assisted Response
- **Reply Suggestions**: Generates contextually relevant reply ideas in real-time.
- **Contextual QA**: Allows users to ask questions about the current conversation without interrupting the live transcription flow.
- **TTS Playback**: Typed responses or selected suggestions are played back using high-quality Text-to-Speech voices.

### 📅 Session History & Personalization
- **Swipe-to-History**: Discrete navigation between active conversation and previous stanzas.
- **User Profiles**: Custom settings for reading pace, readability level, language, and accessibility needs.

---

## 🛠️ Technical Architecture

Vera is built as a **two-plane system**:
1.  **Media Plane (LiveKit)**: Manages real-time audio transport, session orchestration, and STT/TTS infrastructure.
2.  **Logic Plane (LangGraph)**: Orchestrates stateful decisions, chunk-level diagnosis, and assistive transformations.

### Core Stack
- **Frontend**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: Vanilla CSS (Tailored for high legibility and accessibility)
- **Real-Time**: [LiveKit](https://livekit.io/) (Agents, SDKs)
- **AI Orchestration**: [LangChain](https://www.langchain.com/) / [LangGraph](https://www.langchain.com/langgraph)
- **Layout Intelligence**: Powered by `Pretext` for deterministic text measurement and fit evaluation.
- **LLM/Inference**: [Groq](https://groq.com/) (for low-latency reasoning) and LiveKit Inference.

---

## 📂 Project Structure

```text
├── agent/            # LiveKit Agent worker (LangGraph & Real-time media)
├── app/              # Next.js app (Setup, Live View, and System API routes)
├── components/       # Accessible UI components (Stanzas, Input, Overlays)
├── docs/             # Product Requirements, Architecture, and Design guides
├── hooks/            # React hooks for LiveKit sessions and user preferences
├── lib/              # Shared logic, Zod schemas, and client-side utilities
├── prompts/          # Multi-strategy prompts for assistive simplification
└── tests/            # Vitest suite for chunking and orchestration logic
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A [LiveKit Cloud](https://cloud.livekit.io/) project
- A [Groq API Key](https://console.groq.com/)

### Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Accessibility-AI/vera.git
    cd vera
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure environment**:
    Create a `.env` file based on `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Fill in your credentials:
    ```bash
    LIVEKIT_URL=wss://your-project.livekit.cloud
    LIVEKIT_API_KEY=your_key
    LIVEKIT_API_SECRET=your_secret
    LIVEKIT_AGENT_NAME=vera-agent
    GROQ_API_KEY=your_groq_key
    ```

### Running the Application

Vera requires both the **Frontend** and the **Agent** to be running:

#### 1. Start the Frontend
```bash
npm run dev
```

#### 2. Start the Agent (Worker)
```bash
npm run agent:download-files # Run once
npm run agent:dev
```

---

## 🚦 Development Scripts

### 🌐 Frontend
- `npm run dev`: Start the Next.js development server.
- `npm run build`: Build the frontend for production.
- `npm run test`: Run the Vitest test suite.

### 🎙️ Agent (Worker)
- `npm run agent:download-files`: Download required model files.
- `npm run agent:dev`: Launch the LiveKit agent worker in development mode.

---

## 🏛️ Runtime Split

Vera's processing is distributed across two main runtimes:
- **LiveKit Worker**: Handles real-time media transport, Voice Activity Detection (VAD), Groq STT (via OpenAI plugin), and Groq LLM reasoning.
- **Vera App Backend**: Manages LangGraph orchestration for chunk-level diagnosis, assistive transformations, and input routing.
- **Vera TTS**: Uses Groq TTS via a custom `/api/tts` route for manual reply playback.

---

## 📖 Learn More

For deep dives into the vision and implementation:
- [Product Requirements (PRD)](./docs/PRD.md)
- [Technical Architecture](./docs/TECHNICAL_ARCHITECTURE.md)
- [Roadmap](./docs/ROADMAP.md)

---

Developed by the **Accessibility AI** team with insights from Deaf and Hard-of-Hearing communities.
