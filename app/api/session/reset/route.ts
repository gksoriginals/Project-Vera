import { NextResponse } from "next/server";
import { clearSession } from "@/lib/server/session-store";

export async function POST(req: Request) {
  const { sessionId } = await req.json();
  
  if (sessionId) {
    clearSession(sessionId);
  }
  
  return NextResponse.json({ success: true });
}
