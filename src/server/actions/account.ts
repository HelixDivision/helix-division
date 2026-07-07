"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { auth } from "@/lib/auth";
import { addressSchema, changePasswordSchema, profileSchema } from "@/lib/validations/account";
import { changePassword } from "@/server/services/auth";
import { createAddress, deleteAddress, updateAddress, updateProfile } from "@/server/services/user";

/**
 * Customer-account Server Actions (Phase 8). Every action re-checks the
 * session with `auth()` and acts only on the authenticated user's own data —
 * the proxy.ts `/account/*` guard is the first line of defense, not the only
 * one (see AUTH.md#authorization-flow). Input is validated with the shared
 * zod schemas in lib/validations/account.ts, then delegated to
 * server/services/user.ts (profile/addresses) or server/services/auth.ts
 * (password, which stays in the auth service by design).
 */

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
}

function fieldErrorsFrom(error: z.ZodError): Partial<Record<string, string>> {
  const fieldErrors: Partial<Record<string, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "You must be signed in." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    await updateProfile(userId, {
      name: parsed.data.name?.trim() ? parsed.data.name.trim() : null,
      email: parsed.data.email,
    });
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }

  revalidatePath("/account/profile");
  revalidatePath("/account");
  return { success: true };
}

export async function createAddressAction(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "You must be signed in." };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    await createAddress(userId, normalizeAddress(parsed.data));
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }

  revalidatePath("/account/addresses");
  return { success: true };
}

export async function updateAddressAction(
  addressId: string,
  input: unknown,
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "You must be signed in." };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    await updateAddress(addressId, userId, normalizeAddress(parsed.data));
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }

  revalidatePath("/account/addresses");
  return { success: true };
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "You must be signed in." };

  try {
    await deleteAddress(addressId, userId);
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }

  revalidatePath("/account/addresses");
  return { success: true };
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "You must be signed in." };

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  try {
    await changePassword(userId, parsed.data.currentPassword, parsed.data.newPassword);
  } catch (error) {
    // A wrong current password surfaces on that field for a clearer UX.
    return {
      success: false,
      error: errorMessage(error),
      fieldErrors: { currentPassword: errorMessage(error) },
    };
  }

  return { success: true };
}

/** Empty optional strings from the form become null for the Address columns. */
function normalizeAddress(data: z.infer<typeof addressSchema>) {
  const blankToNull = (value?: string) => (value && value.trim() ? value.trim() : null);
  return {
    line1: data.line1.trim(),
    line2: blankToNull(data.line2),
    city: data.city.trim(),
    region: blankToNull(data.region),
    postalCode: data.postalCode.trim(),
    country: data.country.trim(),
    phone: blankToNull(data.phone),
  };
}
