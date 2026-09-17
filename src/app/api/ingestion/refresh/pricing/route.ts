import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedIngestionRequest } from "@/lib/ingestion/route-auth";
import { runScheduledIngestion } from "@/lib/ingestion/runner";

/** A short, isolated lane so price/availability checks cannot delay the daily
 * catalog and size-chart refresh. This route only stages candidates. */
export async function GET(request: NextRequest) {
  if (!isAuthorizedIngestionRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ data: await runScheduledIngestion("price_availability", false), publication: "Price and availability changes are staged with source evidence; they never rewrite a product record without review." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Price refresh failed" }, { status: 400 });
  }
}
