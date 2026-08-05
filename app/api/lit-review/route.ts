import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";
import { compileLiteratureReview } from "@/lib/litReview/compiler";
import { exportToBibTeX, exportToRIS } from "@/lib/integrations/referenceManagers";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const reviews = await sql`
    SELECT id, title, description, item_ids, last_compiled, created_at, updated_at
    FROM literature_reviews
    WHERE user_id = ${session.user.id}
    ORDER BY updated_at DESC
  `;

  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const [user] = await sql`SELECT plan FROM users WHERE id = ${session.user.id}`;
  if (!user || user.plan === "free") {
    return NextResponse.json({ error: "Literature review compiler requires a pro or team plan." }, { status: 403 });
  }

  const body = await req.json();

  if (body.action === "create") {
    const [review] = await sql`
      INSERT INTO literature_reviews (user_id, title, description, item_ids)
      VALUES (${session.user.id}, ${body.title}, ${body.description ?? null}, ${body.itemIds ?? []})
      RETURNING id
    `;
    return NextResponse.json({ reviewId: review.id });
  }

  if (body.action === "compile") {
    const result = await compileLiteratureReview(body.reviewId, session.user.id);
    return NextResponse.json(result);
  }

  if (body.action === "export") {
    const [review] = await sql`
      SELECT compiled_json FROM literature_reviews
      WHERE id = ${body.reviewId} AND user_id = ${session.user.id}
    `;
    if (!review?.compiled_json) {
      return NextResponse.json({ error: "Compile the review first." }, { status: 400 });
    }

    const compiled = review.compiled_json as { sections: { citations: { title: string; authors: string[]; year: number | null; doi: string | null; url: string }[] }[] };
    const citations = compiled.sections?.flatMap((s) => s.citations ?? []) ?? [];

    if (body.format === "bibtex") {
      const bibtex = exportToBibTeX(citations);
      return new Response(bibtex, {
        headers: {
          "Content-Type": "application/x-bibtex",
          "Content-Disposition": 'attachment; filename="references.bib"',
        },
      });
    }

    if (body.format === "ris") {
      const ris = exportToRIS(citations);
      return new Response(ris, {
        headers: {
          "Content-Type": "application/x-research-info-systems",
          "Content-Disposition": 'attachment; filename="references.ris"',
        },
      });
    }

    if (body.format === "markdown") {
      const markdown = (review.compiled_json as { markdown?: string }).markdown ?? "";
      return new Response(markdown, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": 'attachment; filename="literature-review.md"',
        },
      });
    }

    return NextResponse.json({ error: "Unknown format." }, { status: 400 });
  }

  if (body.action === "add-item") {
    await sql`
      UPDATE literature_reviews
      SET item_ids = array_append(item_ids, ${body.itemId}), updated_at = NOW()
      WHERE id = ${body.reviewId} AND user_id = ${session.user.id}
    `;
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
