import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedIngestionRequest } from "@/lib/ingestion/route-auth";
import { runIngestion, runScheduledIngestion } from "@/lib/ingestion/runner";
import type { RefreshLane } from "@/lib/ingestion/types";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function laneFrom(value: string | null): RefreshLane | null {
  if (!value || value === "catalog") return "catalog";
  if (value === "price_availability") return "price_availability";
  if (value === "gap_discovery") return "gap_discovery";
  return null;
}

/** Vercel Cron invokes this route with GET. The daily catalogue run also starts
 * approved gap-discovery sources. Those sources may resolve only the queued
 * catalogue gaps they are licensed to provide; neither run publishes products. */
export async function GET(request: NextRequest) {
  if (!isAuthorizedIngestionRequest(request)) return unauthorized();
  const lane = laneFrom(request.nextUrl.searchParams.get("lane"));
  if (!lane) return NextResponse.json({ error: "Invalid refresh lane" }, { status: 400 });
  try {
    const data = await runScheduledIngestion(lane, false);
    const gapDiscovery = lane === "catalog" ? await runScheduledIngestion("gap_discovery", false) : null;
    return NextResponse.json({ data, gapDiscovery, publication: "Scheduled refreshes create candidates only. Gap discovery runs only approved sources and never publishes a product without source, privacy and human review." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ingestion failed" }, { status: 400 });
  }
}

/** Retained for protected manual QA and an individual source dry run. */
export async function POST(request: NextRequest) {
  if (!isAuthorizedIngestionRequest(request)) return unauthorized();
  const body = await request.json().catch(() => ({}));
  try {
    return NextResponse.json({ data: await runIngestion(body.sourceId ?? "demo-authorized-feed", body.dryRun !== false), publication: "Candidates require a recorded source/rights/editorial review before canonical records are published." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ingestion failed" }, { status: 400 });
  }
}
