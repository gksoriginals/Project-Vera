import { NextRequest, NextResponse } from "next/server";
import { runInputGraph } from "@/lib/server/graphs/input-graph";
import type { RouteInputPayload } from "@/lib/types";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as RouteInputPayload;
  const result = await runInputGraph(payload);

  return NextResponse.json(result);
}
