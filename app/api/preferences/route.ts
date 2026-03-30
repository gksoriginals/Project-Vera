import { NextRequest, NextResponse } from "next/server";
import { getRequestSessionId } from "@/lib/server/request-session";
import {
  getPreferences,
  updateSessionPreferences
} from "@/lib/server/session-store";
import type { UserPreferences } from "@/lib/types";

export async function GET(request: NextRequest) {
  const sessionId = getRequestSessionId(request);
  return NextResponse.json({
    preferences: getPreferences(sessionId)
  });
}

export async function PUT(request: NextRequest) {
  const sessionId = getRequestSessionId(request);
  const body = (await request.json()) as { preferences: UserPreferences };

  return NextResponse.json({
    preferences: updateSessionPreferences(sessionId, body.preferences)
  });
}
