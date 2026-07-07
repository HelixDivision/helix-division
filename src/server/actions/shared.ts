// Shared result shape + helpers for Server Action modules. Deliberately NOT
// marked "use server" — a "use server" module may only export async functions,
// and these are sync utilities imported *by* the action files (auth.ts,
// account.ts, checkout.ts), which were each carrying their own copies until
// the pre-Phase-9 architecture review.

import { auth } from "@/lib/auth";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
}

/** Safe user-facing message from an unknown thrown value. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

/**
 * First zod issue per field, keyed by the full dotted path (e.g. "email" or
 * "variants.0.sku") — react-hook-form's `setError` accepts dotted paths, so
 * nested array errors (admin product variants) land on the exact input.
 */
export function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Partial<Record<string, string>> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

/**
 * Two-layer authorization, layer two (see AUTH.md#authorization-flow):
 * every admin Server Action calls this itself rather than trusting
 * proxy.ts's /admin/* gate — a Server Action endpoint is directly reachable
 * regardless of which page triggered it. Returns the admin's user id, or
 * null (caller returns a generic failure).
 */
export async function requireAdmin(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") return null;
  return session.user.id;
}
