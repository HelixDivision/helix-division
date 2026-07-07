// Shared result shape + helpers for Server Action modules. Deliberately NOT
// marked "use server" — a "use server" module may only export async functions,
// and these are sync utilities imported *by* the action files (auth.ts,
// account.ts, checkout.ts), which were each carrying their own copies until
// the pre-Phase-9 architecture review.

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
}

/** Safe user-facing message from an unknown thrown value. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

/** First zod issue per top-level field, keyed by field name — the shape the forms' `form.setError` loops consume. */
export function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Partial<Record<string, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
