import { NextRequest, NextResponse } from "next/server";
import { hasLiveKitConfig } from "@/lib/server/livekit";
import {
  createLiveKitParticipantToken,
  type LiveKitTokenRequest
} from "@/lib/server/livekit-token";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as LiveKitTokenRequest;
    const payload = await createLiveKitParticipantToken(body);

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    console.error("LiveKit token generation failed.", error);

    return NextResponse.json(
      {
        error: "Failed to generate a LiveKit token."
      },
      { status: 500 }
    );
  }
}
