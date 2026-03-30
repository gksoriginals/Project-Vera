import { NextRequest, NextResponse } from "next/server";
import { getDefaultTts } from "@/lib/server/models";
import { getRequestSessionId } from "@/lib/server/request-session";
import {
  addReplyToSession,
  getPreferences
} from "@/lib/server/session-store";

export async function POST(request: NextRequest) {
  try {
    const sessionId = getRequestSessionId(request);
    const body = (await request.json()) as { text: string; groqApiKey?: string };
    const preferences = getPreferences(sessionId);
    
    const audio = await getDefaultTts(body.groqApiKey).synthesize(body.text, {
      voice: preferences.ttsVoice
    });

    addReplyToSession(sessionId, body.text);

    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store"
      }
    });
  } catch (error: any) {
    console.error("[TTS API Error]", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Speech synthesis failed" },
      { status: 500 }
    );
  }
}
