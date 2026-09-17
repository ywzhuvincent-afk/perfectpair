import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminCookieOptions, adminSessionCookie, createAdminSession, hasAdminSession, isAdminConsoleConfigured, validateAdminAccessCode } from "@/lib/admin-auth";

const loginSchema = z.object({ accessCode: z.string().min(12).max(256) });

export async function GET(request: NextRequest) {
  return NextResponse.json({ configured: isAdminConsoleConfigured(), authenticated: hasAdminSession(request) });
}

export async function POST(request: NextRequest) {
  if (!isAdminConsoleConfigured()) return NextResponse.json({ error: "The operator console is not configured." }, { status: 503 });
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !validateAdminAccessCode(parsed.data.accessCode)) {
    return NextResponse.json({ error: "Invalid access code." }, { status: 401 });
  }
  const session = createAdminSession();
  if (!session) return NextResponse.json({ error: "The operator console is not configured." }, { status: 503 });
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(adminSessionCookie, session, adminCookieOptions);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(adminSessionCookie, "", { ...adminCookieOptions, maxAge: 0 });
  return response;
}
