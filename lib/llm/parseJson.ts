/**
 * Robust JSON extraction from LLM output.
 * Handles markdown code blocks, extra text, and various formats.
 */
export function extractJson<T = unknown>(text: string): T | null {
  // Strip markdown code blocks
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  // Strategy 1: find JSON object
  try {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]) as T;
  } catch { /* next */ }

  // Strategy 2: find JSON array
  try {
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (m) return JSON.parse(m[0]) as T;
  } catch { /* next */ }

  // Strategy 3: full text
  try {
    return JSON.parse(cleaned) as T;
  } catch { /* give up */ }

  return null;
}

export function extractJsonArray<T = unknown>(text: string): T[] | null {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  // Strategy 1: direct array
  try {
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (m) {
      const arr = JSON.parse(m[0]);
      if (Array.isArray(arr) && arr.length > 0) return arr as T[];
    }
  } catch { /* next */ }

  // Strategy 2: object with array property
  try {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      const obj = JSON.parse(m[0]);
      const arr = Object.values(obj).find(v => Array.isArray(v) && (v as unknown[]).length > 0);
      if (arr) return arr as T[];
    }
  } catch { /* next */ }

  // Strategy 3: full parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed as T[];
    const arr = Object.values(parsed).find(v => Array.isArray(v));
    if (arr) return arr as T[];
  } catch { /* give up */ }

  return null;
}
