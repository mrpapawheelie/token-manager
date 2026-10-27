import { NextResponse } from "next/server";

import { getProject } from "@/lib/mock-events";
import { toScannerToken } from "@/lib/scanner-public";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const project = getProject(id);
  if (!project) {
    return NextResponse.json(
      {
        error: "not_found",
        id,
        mock: true,
        live: false,
        verification: null,
        note: "Unknown id. Verification flags are omitted rather than filled in.",
      },
      { status: 404 },
    );
  }
  return NextResponse.json(toScannerToken(project), {
    headers: {
      "Cache-Control": "public, max-age=60",
      "X-RateLimit-Policy": "unenforced; fixture; see GET /api/scanner/tokens",
    },
  });
}
