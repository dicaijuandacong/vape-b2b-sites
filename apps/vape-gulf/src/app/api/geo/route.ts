import { NextResponse } from "next/server";

/**
 * Returns the visitor's ISO-3166 country code from Vercel's edge geo
 * header (x-vercel-ip-country, populated on every request at the edge).
 *
 * Used by the client LocaleProvider to default Arabic-speaking-region
 * visitors (GCC) to the Arabic UI on first visit, rather than relying
 * solely on browser language. Returns { country: null } off-Vercel.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("x-vercel-ip-country-resolution") ??
    null;

  return NextResponse.json(
    { country },
    { headers: { "Cache-Control": "no-store" } },
  );
}
