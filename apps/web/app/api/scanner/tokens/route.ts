import { NextResponse } from "next/server";

import { scannerListBody } from "@/lib/scanner-public";

export function GET(request: Request) {
  const limitParam = new URL(request.url).searchParams.get("limit");
  let limit: number | undefined;
  if (limitParam !== null) {
    const parsed = Number(limitParam);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      return NextResponse.json(
        {
          error: "bad_limit",
          verification: null,
          note: "limit is an integer from 1 to 100. No tokens were invented for this request.",
        },
        { status: 400 },
      );
    }
    limit = parsed;
  }
  return NextResponse.json(scannerListBody(limit), {
    headers: {
      "Cache-Control": "public, max-age=60",
      "X-RateLimit-Policy": "unenforced; fixture; see rateLimit in the body",
    },
  });
}
