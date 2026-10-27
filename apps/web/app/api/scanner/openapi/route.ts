import { NextResponse } from "next/server";

import { SCANNER_OPENAPI, SCANNER_RATE_LIMIT } from "@/lib/scanner-public";

export function GET() {
  return NextResponse.json(
    { ...SCANNER_OPENAPI, rateLimit: SCANNER_RATE_LIMIT },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}
