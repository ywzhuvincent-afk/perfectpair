import { NextRequest, NextResponse } from "next/server";
import { getBrandSourceReadiness, getBrandSourceRosterSummary } from "@/lib/ingestion/brand-source-roster";
import { isAuthorizedIngestionRequest } from "@/lib/ingestion/route-auth";

/** Internal acquisition dashboard API. It returns the complete target list but
 * never returns source credentials or lets a request activate a source. */
export async function GET(request: NextRequest) {
  if (!isAuthorizedIngestionRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    summary: getBrandSourceRosterSummary(),
    targets: getBrandSourceReadiness(),
    activationRule: "A target may be linked only after an authorised feed or API, written field/publication scope, rights review, and sample-feed validation are all recorded.",
  });
}
