import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  voice
} from "@livekit/agents";
import * as livekit from "@livekit/agents-plugin-livekit";
import * as openai from "@livekit/agents-plugin-openai";
import * as silero from "@livekit/agents-plugin-silero";
import { VeraLiveKitAgent } from "./vera-livekit-agent";
import { getLiveKitConfig } from "../lib/server/livekit";

dotenv.config({ path: ".env" });

function getAgentName() {
  return getLiveKitConfig().agentName;
}

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx: JobContext) => {
    const session = new voice.AgentSession({
      vad: ctx.proc.userData.vad as silero.VAD,
      stt: openai.STT.withGroq({
        model: "whisper-large-v3-turbo"
      }),
      llm: openai.LLM.withGroq({
        model: "llama-3.1-8b-instant",
        temperature: 0.2
      }),
      turnHandling: {
        turnDetection: new livekit.turnDetector.MultilingualModel(),
        endpointing: {
          minDelay: 400,
          maxDelay: 800
        }
      }
    });

    const agent = await VeraLiveKitAgent.create({
      room: ctx.room
    });

    await session.start({
      agent,
      room: ctx.room
    });

    await ctx.connect();
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cli.runApp(
    new ServerOptions({
      agent: fileURLToPath(import.meta.url),
      agentName: getAgentName()
    })
  );
}
