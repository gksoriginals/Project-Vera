import type { NextRequest } from "next/server";

export function getRequestSessionId(request: NextRequest) {
  return request.headers.get("x-vera-session-id") ?? crypto.randomUUID();
}
