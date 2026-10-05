/**
 * Completed-homework marks are kept in a cookie so the server can render every
 * card in its final shape. A localStorage-only store would ship an expanded
 * card in the initial HTML and collapse it after hydration, which moves the
 * rest of the page around on every load.
 *
 * The ids are stored URI-encoded because cookie values may not contain raw
 * JSON punctuation.
 */

/** Browsers cap a cookie at ~4 KB, so keep the list well inside that budget. */
export const COMPLETED_ID_LIMIT = 100;

export function parseCompletedIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // Keep the raw value; a hand-edited cookie simply fails JSON parsing below.
  }
  try {
    const parsed: unknown = JSON.parse(decoded);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function encodeCompletedIds(ids: readonly string[]): string {
  return encodeURIComponent(JSON.stringify(ids.slice(-COMPLETED_ID_LIMIT)));
}

export function toggleCompletedId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}
