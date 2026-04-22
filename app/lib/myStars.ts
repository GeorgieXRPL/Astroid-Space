/**
 * @fileoverview Client-only localStorage helper for "my stars".
 *
 * When you name a star, the server returns a claim token. We persist the
 * minimal record locally so you can re-find your star later without a
 * wallet or an account. This is a recovery aid, not authentication.
 */

export interface MyStarRecord {
  designation: string;
  name: string;
  claimToken: string;
  namedAt: string;
}

const KEY = 'astroid:my-stars:v1';

function readAll(): MyStarRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is MyStarRecord =>
        r &&
        typeof r === 'object' &&
        typeof r.designation === 'string' &&
        typeof r.name === 'string' &&
        typeof r.claimToken === 'string' &&
        typeof r.namedAt === 'string'
    );
  } catch {
    return [];
  }
}

function writeAll(records: MyStarRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    // Quota exceeded or storage disabled — not fatal
  }
}

/** Add (or replace if same designation) a star to the local list. */
export function rememberMyStar(record: MyStarRecord): void {
  const all = readAll().filter((r) => r.designation !== record.designation);
  all.unshift(record);
  // Soft cap so localStorage never blows up
  writeAll(all.slice(0, 50));
}

export function getMyStars(): MyStarRecord[] {
  return readAll();
}

export function forgetMyStar(designation: string): void {
  writeAll(readAll().filter((r) => r.designation !== designation));
}
