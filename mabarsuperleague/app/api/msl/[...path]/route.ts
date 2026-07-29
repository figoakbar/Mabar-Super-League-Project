import { NextResponse, type NextRequest } from "next/server";

import { API_BASE_SERVER } from "@/lib/admin/api";
import { getSessionToken } from "@/lib/auth/session";

// Same-origin gateway to the NestJS API for browser code.
//
// Why this exists: the session token lives in an httpOnly cookie, so client
// components cannot read it to build an Authorization header. This handler runs
// on the server, reads the cookie, and forwards the call with a bearer token.
// The backend still enforces every permission — this only carries identity.

/** Paths the browser may reach through the proxy. Everything else is refused. */
const ALLOWED = [
  /^tournaments(\/|$)/,
  /^participants(\/|$)/,
  /^matches(\/|$)/,
  /^race-results(\/|$)/,
  /^users(\/|$)/,
  /^reports(\/|$)/,
  // Self-service profile edits only. Login, register and the password-reset
  // endpoints stay off-limits here — those go through server actions, which
  // also own the session cookie.
  /^auth\/me(\/|$)/,
];

// Hop-by-hop and body-framing headers must not be copied through.
const STRIP = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "accept-encoding",
  "cookie",
  "authorization",
]);

async function forward(req: NextRequest, path: string[]) {
  const suffix = path.join("/");
  if (!ALLOWED.some((re) => re.test(suffix))) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const token = await getSessionToken();
  const target = `${API_BASE_SERVER}/${suffix}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!STRIP.has(key.toLowerCase())) headers.set(key, value);
  });
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const res = await fetch(target, {
    method: req.method,
    headers,
    // Streaming the body keeps multipart receipt uploads working unchanged.
    body: hasBody ? req.body : undefined,
    ...(hasBody ? { duplex: "half" } : {}),
    cache: "no-store",
    redirect: "manual",
  } as RequestInit & { duplex?: "half" });

  const body = await res.arrayBuffer();
  const out = new NextResponse(body, { status: res.status });
  const type = res.headers.get("content-type");
  if (type) out.headers.set("content-type", type);
  return out;
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
