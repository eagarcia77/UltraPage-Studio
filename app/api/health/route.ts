/** CREVELIO — © 2026 Eduardo Augusto García Rodríguez. All rights reserved. */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    product: "CREVELIO",
    operator: "ZENQAVIO Technologies",
    creator: "Eduardo Augusto García Rodríguez",
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
