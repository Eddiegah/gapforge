/**
 * Reference Manager Integrations
 *
 * Zotero: Uses the official Zotero Web API v3 (documented at https://www.zotero.org/support/dev/web_api/v3)
 * Mendeley: Uses Mendeley Reference Manager API v1 (OAuth2, https://dev.mendeley.com/)
 */

export interface ReferenceItem {
  title: string;
  authors: string[];
  year: number | null;
  doi: string | null;
  url: string;
  abstract?: string | null;
  tags?: string[];
  notes?: string;
}

// ─── Zotero ──────────────────────────────────────────────────────────────────

export async function exportToZotero(
  items: ReferenceItem[],
  userKey: string,    // user-provided Zotero API key
  userId: string      // Zotero user ID (numeric string)
): Promise<{ succeeded: number; failed: number; errors: string[] }> {
  const API_BASE = "https://api.zotero.org";
  const headers = {
    "Zotero-API-Version": "3",
    "Zotero-API-Key": userKey,
    "Content-Type": "application/json",
  };

  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  // Zotero accepts up to 50 items per write request
  const chunks = chunkArray(items, 50);

  for (const chunk of chunks) {
    const payload = chunk.map((item) => ({
      itemType: "journalArticle",
      title: item.title,
      creators: item.authors.map((name) => {
        const parts = name.split(" ");
        return {
          creatorType: "author",
          firstName: parts.slice(0, -1).join(" "),
          lastName: parts[parts.length - 1] ?? name,
        };
      }),
      date: item.year?.toString() ?? "",
      DOI: item.doi ?? "",
      url: item.url,
      abstractNote: item.abstract ?? "",
      tags: (item.tags ?? []).map((t) => ({ tag: t })),
      note: item.notes ?? "",
    }));

    const res = await fetch(`${API_BASE}/users/${userId}/items`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      succeeded += (data.success ? Object.keys(data.success).length : 0);
      failed += (data.failed ? Object.keys(data.failed).length : 0);
      if (data.failed) {
        Object.values(data.failed as Record<string, { message?: string }>).forEach((f) => {
          errors.push(f?.message ?? "Unknown error");
        });
      }
    } else {
      failed += chunk.length;
      errors.push(`Zotero API returned ${res.status}: ${await res.text()}`);
    }
  }

  return { succeeded, failed, errors };
}

/** Get Zotero user ID from API key — required for API calls */
export async function getZoteroUserId(apiKey: string): Promise<string | null> {
  const res = await fetch("https://api.zotero.org/keys/current", {
    headers: { "Zotero-API-Key": apiKey, "Zotero-API-Version": "3" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.userID?.toString() ?? null;
}

// ─── Mendeley ────────────────────────────────────────────────────────────────

/** Exchange OAuth2 authorization code for access token */
export async function getMendeleyToken(code: string, redirectUri: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
} | null> {
  const res = await fetch("https://api.mendeley.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.MENDELEY_CLIENT_ID!,
      client_secret: process.env.MENDELEY_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function exportToMendeley(
  items: ReferenceItem[],
  accessToken: string
): Promise<{ succeeded: number; failed: number; errors: string[] }> {
  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      const payload = {
        title: item.title,
        authors: item.authors.map((name) => {
          const parts = name.split(" ");
          return {
            first_name: parts.slice(0, -1).join(" "),
            last_name: parts[parts.length - 1] ?? name,
          };
        }),
        year: item.year ?? undefined,
        identifiers: item.doi ? { doi: item.doi } : undefined,
        websites: item.url ? [item.url] : undefined,
        abstract: item.abstract ?? undefined,
        type: "journal",
        tags: item.tags ?? [],
        notes: item.notes ?? undefined,
      };

      const res = await fetch("https://api.mendeley.com/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/vnd.mendeley-document.1+json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        succeeded++;
      } else {
        failed++;
        errors.push(`Mendeley rejected item "${item.title}": ${res.status}`);
      }
    } catch (err) {
      failed++;
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return { succeeded, failed, errors };
}

// ─── BibTeX export (universal fallback) ──────────────────────────────────────

export function exportToBibTeX(items: ReferenceItem[]): string {
  return items
    .map((item, i) => {
      const key = `ref${i + 1}_${(item.authors[0] ?? "unknown").split(" ").pop() ?? "anon"}_${item.year ?? "nd"}`;
      const authors = item.authors.join(" and ");
      const lines = [
        `@article{${key},`,
        `  title = {${item.title}},`,
        `  author = {${authors}},`,
        item.year ? `  year = {${item.year}},` : null,
        item.doi ? `  doi = {${item.doi}},` : null,
        item.url ? `  url = {${item.url}},` : null,
        item.abstract ? `  abstract = {${item.abstract.replace(/[{}]/g, "")}},` : null,
        `}`,
      ]
        .filter(Boolean)
        .join("\n");
      return lines;
    })
    .join("\n\n");
}

// ─── RIS export ──────────────────────────────────────────────────────────────

export function exportToRIS(items: ReferenceItem[]): string {
  return items
    .map((item) => {
      const lines = [
        "TY  - JOUR",
        `TI  - ${item.title}`,
        ...item.authors.map((a) => `AU  - ${a}`),
        item.year ? `PY  - ${item.year}` : null,
        item.doi ? `DO  - ${item.doi}` : null,
        item.url ? `UR  - ${item.url}` : null,
        item.abstract ? `AB  - ${item.abstract}` : null,
        ...(item.tags ?? []).map((t) => `KW  - ${t}`),
        "ER  - ",
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n\n");
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
