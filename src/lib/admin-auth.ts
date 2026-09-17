import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const adminSessionCookie = "perfectpair_admin";
const sessionLifetimeSeconds = 60 * 60 * 12;

function configuredAccessCode() {
  return process.env.ADMIN_ACCESS_CODE;
}

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET;
}

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

/** This console intentionally has no development fallback in production. */
export function isAdminConsoleConfigured() {
  return Boolean(configuredAccessCode() && sessionSecret());
}

export function validateAdminAccessCode(value: string) {
  const expected = configuredAccessCode();
  return Boolean(expected && safeEqual(value, expected));
}

export function createAdminSession() {
  const secret = sessionSecret();
  if (!secret) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetimeSeconds;
  const value = String(expiresAt);
  return `${value}.${signature(value, secret)}`;
}

export function hasAdminSession(request: NextRequest) {
  const secret = sessionSecret();
  const raw = request.cookies.get(adminSessionCookie)?.value;
  if (!secret || !raw) return false;
  const [expiresAt, receivedSignature, ...extra] = raw.split(".");
  if (!expiresAt || !receivedSignature || extra.length || !/^\d{10,}$/.test(expiresAt)) return false;
  if (Number(expiresAt) < Math.floor(Date.now() / 1000)) return false;
  return safeEqual(receivedSignature, signature(expiresAt, secret));
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: sessionLifetimeSeconds,
};
