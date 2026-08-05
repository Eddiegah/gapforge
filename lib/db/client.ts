import { neon } from "@neondatabase/serverless";

// Lazy initialization — called at request time, not module load time
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

// Named export for use as tagged template literal:
// const rows = await sql`SELECT ...`
export async function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<Record<string, unknown>[]> {
  const db = getDb();
  return db(strings, ...values) as Promise<Record<string, unknown>[]>;
}
