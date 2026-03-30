import { NextRequest, NextResponse } from "next/server";
import { getRequestSessionId } from "@/lib/server/request-session";
import { getSessionRecord } from "@/lib/server/session-store";

export async function GET(request: NextRequest) {
  const sessionId = getRequestSessionId(request);
  return NextResponse.json(getSessionRecord(sessionId));
}
