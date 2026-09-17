import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { getAdminDashboard } from "@/lib/admin-data";

export async function GET(request: NextRequest) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ data: await getAdminDashboard() });
  } catch (error) {
    console.error("PerfectPair admin dashboard failed", error);
    return NextResponse.json({ error: "The operations dashboard could not be loaded." }, { status: 503 });
  }
}
