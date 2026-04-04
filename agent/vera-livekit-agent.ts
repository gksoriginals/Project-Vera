import { llm, voice } from "@livekit/agents";
import type { ConversationChunk, UserPreferences } from "../lib/types";
import { loadPrompt } from "../lib/server/prompt-loader";
import { runChunkGraph } from "../lib/server/graphs/chunk-graph";
import { runInputGraph } from "../lib/server/graphs/input-graph";

const EMPTY_SURFACE = {
  occupancy: 0,
  lineCount: 0,
  fontSize: 0,
  isAtMinimumFontSize: false,
  isOverflowing: false
} as const;

type AgentRemoteParticipant = {
  metadata?: string;
};

type AgentRoomContext = {
  remoteParticipants: Map<string, AgentRemoteParticipant>;
};

export class VeraLiveKitAgent extends voice.Agent {
  #chunkHistory: ConversationChunk[] = [];
  #preferences: UserPreferences;
  #groqApiKey?: string;
  #room?: AgentRoomContext;

  private constructor(options: {
    instructions: string;
    preferences: UserPreferences;
    room?: AgentRoomContext;
  }) {
    super({
      instructions: options.instructions
    });
    this.#preferences = options.preferences;
    this.#room = options.room;
  }

  static async create(options?: {
    preferences?: UserPreferences;
    room?: AgentRoomContext;
  }) {
    const instructions = await loadPrompt("livekit-agent-system");

    return new VeraLiveKitAgent({
      instructions,
      preferences:
        options?.preferences ??
        {
          language: "English",
          readability: "Balanced simplification",
          pace: "Steady pace",
          ttsVoice: "hannah"
        },
      room: options?.room
    });
  }

  async onUserTurnCompleted(
    chatCtx: llm.ChatContext,
    newMessage: llm.ChatMessage
  ) {
    const transcript = newMessage.textContent?.trim();
    console.log(`[Vera] Processing turn: "${transcript}"`);

    // Extract ephemeral Groq key from ANY remote participant metadata if available
    try {
      const room = this.#room;
      if (room) {
        for (const p of room.remoteParticipants.values()) {
          const metadataStr = p.metadata;
          if (metadataStr) {
            const metadata = JSON.parse(metadataStr);
            if (metadata.groq_api_key) {
              this.#groqApiKey = metadata.groq_api_key;
              break;
            }
          }
        }
      }
    } catch {
      // Ignore parsing errors
    }

    if (!transcript) {
      throw new voice.StopResponse();
    }

    try {
      const processed = await runChunkGraph({
        transcript,
        history: this.#chunkHistory,
        preferences: this.#preferences,
        surface: EMPTY_SURFACE,
        forceSimplify: true,
        groqApiKey: this.#groqApiKey
      });

      console.log(`[Vera] Incoming: "${transcript}"`);

      if (processed.shouldCommit && processed.chunk) {
        console.log(`[Vera] Simplified: "${processed.chunk.simplified}"`);
        this.#chunkHistory.push(processed.chunk);
      }

      const inputResult = await runInputGraph({
        text: transcript,
        history: this.#chunkHistory,
        preferences: this.#preferences,
        groqApiKey: this.#groqApiKey
      });

      if (inputResult.intent === "question") {
        chatCtx.addMessage({
          role: "assistant",
          content: `${inputResult.answer.title}\n${inputResult.answer.body}`,
          extra: {
            is_context_answer: true
          }
        });

        await this.updateChatCtx(chatCtx);
      } else {
        const latestChunk = processed.chunk?.simplified;
        const suggestions = (inputResult.options ?? [])
          .slice(0, 2)
          .map((reply) => reply.text)
          .join(" | ");

        if (latestChunk) {
          chatCtx.addMessage({
            role: "assistant",
            content: `Assistive simplification: ${latestChunk}${suggestions ? `\nReply ideas: ${suggestions}` : ""}`,
            extra: {
              is_assistive_note: true
            }
          });

          await this.updateChatCtx(chatCtx);
        }
      }
    } catch (error) {
      console.error("[Vera] Error during turn processing:", error);
    }

    throw new voice.StopResponse();
  }
}
