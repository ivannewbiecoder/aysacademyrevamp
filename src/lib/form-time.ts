/**
 * Timestamp embedded in public forms at render time. Submissions that arrive
 * implausibly fast after it are treated as bots (see app/actions/lead.ts).
 */
export function formIssuedAt(): number {
  return Date.now();
}
