import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasAdminSession } from "@/lib/admin-auth";
import { draftProductFromPublicFacts, productDraftErrorMessage } from "@/lib/operator-product-draft";

export const runtime = "nodejs";

const requestSchema = z.object({
  url: z.string().trim().min(8).max(2_000),
  sourceAttested: z.literal(true),
});

export async function POST(request: NextRequest) {
  if (!hasAdminSession(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "请先确认该产品链接可用于事实核对。" }, { status: 400 });
  try {
    return NextResponse.json({ data: await draftProductFromPublicFacts(parsed.data.url) });
  } catch (error) {
    return NextResponse.json({ error: productDraftErrorMessage(error) }, { status: 400 });
  }
}
