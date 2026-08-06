import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "all";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    let rows;
    if (query && category !== "all") {
      rows = await sql`
        SELECT sg.id, sg.gap_json, sg.created_at,
          COUNT(gv.saved_gap_id) FILTER (WHERE gv.direction = 'up') as upvotes
        FROM saved_gaps sg
        LEFT JOIN gap_votes gv ON gv.saved_gap_id = sg.id
        WHERE (sg.gap_json->>'title' ILIKE ${'%' + query + '%'}
           OR sg.gap_json->>'description' ILIKE ${'%' + query + '%'})
          AND sg.gap_json->>'category' = ${category}
        GROUP BY sg.id, sg.gap_json, sg.created_at
        ORDER BY upvotes DESC, sg.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (query) {
      rows = await sql`
        SELECT sg.id, sg.gap_json, sg.created_at,
          COUNT(gv.saved_gap_id) FILTER (WHERE gv.direction = 'up') as upvotes
        FROM saved_gaps sg
        LEFT JOIN gap_votes gv ON gv.saved_gap_id = sg.id
        WHERE sg.gap_json->>'title' ILIKE ${'%' + query + '%'}
           OR sg.gap_json->>'description' ILIKE ${'%' + query + '%'}
        GROUP BY sg.id, sg.gap_json, sg.created_at
        ORDER BY upvotes DESC, sg.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (category !== "all") {
      rows = await sql`
        SELECT sg.id, sg.gap_json, sg.created_at,
          COUNT(gv.saved_gap_id) FILTER (WHERE gv.direction = 'up') as upvotes
        FROM saved_gaps sg
        LEFT JOIN gap_votes gv ON gv.saved_gap_id = sg.id
        WHERE sg.gap_json->>'category' = ${category}
        GROUP BY sg.id, sg.gap_json, sg.created_at
        ORDER BY upvotes DESC, sg.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      rows = await sql`
        SELECT sg.id, sg.gap_json, sg.created_at,
          COUNT(gv.saved_gap_id) FILTER (WHERE gv.direction = 'up') as upvotes
        FROM saved_gaps sg
        LEFT JOIN gap_votes gv ON gv.saved_gap_id = sg.id
        GROUP BY sg.id, sg.gap_json, sg.created_at
        ORDER BY upvotes DESC, sg.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const [countRow] = await sql`SELECT COUNT(*) as total FROM saved_gaps`;

    return NextResponse.json({
      gaps: rows,
      total: Number(countRow?.total ?? 0),
      page,
      pages: Math.ceil(Number(countRow?.total ?? 0) / limit),
    });
  } catch {
    return NextResponse.json({ gaps: [], total: 0, page: 1, pages: 1 });
  }
}
