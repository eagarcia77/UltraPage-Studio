import { NextRequest, NextResponse } from "next/server";

type Counter = { count: number; resetAt: number };
const counters = new Map<string, Counter>();

export function guardApiRequest(request: NextRequest, options: { scope: string; maxBytes: number; requestsPerMinute: number }) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (!Number.isFinite(declaredLength) || declaredLength < 0 || declaredLength > options.maxBytes) {
    return NextResponse.json({ error: "The request exceeds the permitted size." }, { status: 413, headers: { "Cache-Control": "no-store", "Retry-After": "60" } });
  }
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const client = forwarded || request.headers.get("x-real-ip") || "anonymous";
  const key = `${options.scope}:${client}`;
  const now = Date.now();
  const current = counters.get(key);
  const entry = !current || current.resetAt <= now ? { count: 1, resetAt: now + 60_000 } : { ...current, count: current.count + 1 };
  counters.set(key, entry);
  if (counters.size > 5_000) for (const [storedKey, value] of counters) if (value.resetAt <= now) counters.delete(storedKey);
  if (entry.count > options.requestsPerMinute) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))) } });
  }
  return null;
}
