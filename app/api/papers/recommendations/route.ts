import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ papers: [] });
  try {
    const gaps = await sql`SELECT gap_json->>'title' as title FROM saved_gaps WHERE user_id = ${session.user.id} ORDER BY created_at DESC LIMIT 3`;
    if (gaps.length === 0) return NextResponse.json({ papers: [] });
    const query = gaps.map(g => (g.title as string)?.split(" ").slice(0, 3).join(" ") ?? "").filter(Boolean).slice(0, 2).join(" ");
    const res = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=6&sort=publication_date:desc&mailto=research@gapforge.app`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return NextResponse.json({ papers: [] });
    const data = await res.json();
    const papers = (data.results ?? []).map((p: Record<string, unknown>) => ({
      id: p.id, title: p.title,
      authors: ((p.authorships as { author: { display_name: string } }[]) ?? []).slice(0, 3).map(a => a.author.display_name),
      year: p.publication_year,
      doi: (p.doi as string)?.replace("https://doi.org/", "") ?? null,
      url: (p.doi as string) ?? (p.id as string),
      venue: (p.primary_location as { source?: { display_name?: string } } | null)?.source?.display_name ?? null,
    }));
    return NextResponse.json({ papers });
  } catch { return NextResponse.json({ papers: [] }); }
}
