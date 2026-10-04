import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    product: "UltraPage Studio",
    releaseStage: process.env.ULTRAPAGE_RELEASE_STAGE || "pre-commercial",
    version: process.env.ULTRAPAGE_VERSION || "development",
    checkedAt: new Date().toISOString(),
  }, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
