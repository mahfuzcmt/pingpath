import { NextRequest, NextResponse } from "next/server";
import { backendBase, readSession } from "@/lib/session";

const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

async function forward(req: NextRequest, path: string[]): Promise<NextResponse> {
  if (!ALLOWED_METHODS.has(req.method)) {
    return NextResponse.json({ error: { code: "METHOD_NOT_ALLOWED" } }, { status: 405 });
  }
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  }

  const search = req.nextUrl.search;
  const url = `${backendBase()}/${path.map(encodeURIComponent).join("/")}${search}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.accessToken}`,
    Accept: req.headers.get("accept") ?? "application/json",
  };
  const ct = req.headers.get("content-type");
  if (ct) headers["Content-Type"] = ct;

  const hasBody = req.method !== "GET" && req.method !== "DELETE";
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body: body ? Buffer.from(body) : undefined,
    cache: "no-store",
    redirect: "manual",
  });

  const respBody = await upstream.arrayBuffer();
  const respHeaders = new Headers();
  const respCt = upstream.headers.get("content-type");
  if (respCt) respHeaders.set("content-type", respCt);
  const respCd = upstream.headers.get("content-disposition");
  if (respCd) respHeaders.set("content-disposition", respCd);
  return new NextResponse(respBody, { status: upstream.status, headers: respHeaders });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await ctx.params).path);
}
