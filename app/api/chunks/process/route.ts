import { NextRequest, NextResponse } from "next/server";
import { runChunkGraph } from "@/lib/server/graphs/chunk-graph";
import { getRequestSessionId } from "@/lib/server/request-session";
import { addChunkToSession } from "@/lib/server/session-store";
import type { ProcessChunkPayload } from "@/lib/types";

function isRateLimitError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("rate_limit_exceeded") ||
    message.includes("rate limit") ||
    message.includes("429")
  );
}

export async function POST(request: NextRequest) {
  const sessionId = getRequestSessionId(request);
  const payload = (await request.json()) as ProcessChunkPayload;

  try {
    const result = await runChunkGraph(payload);

    if (result.shouldCommit && result.chunk) {
      addChunkToSession(sessionId, result.chunk);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json({
        shouldCommit: false,
        pendingTranscript: payload.transcript.trim(),
        readinessReason: "rate_limited",
        replySuggestions: []
      });
    }

    console.error("Chunk processing failed", error);

    return NextResponse.json(
      {
        shouldCommit: false,
        pendingTranscript: payload.transcript.trim(),
        readinessReason: "processing_unavailable",
        replySuggestions: []
      },
      { status: 200 }
    );
  }
}
