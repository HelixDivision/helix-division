import type { Address, User } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/**
 * Account-management service (Phase 8, Customer Accounts) — the counterpart to
 * server/services/auth.ts, split along the boundary documented in
 * AUTH.md#auth-vs-future-user-service. This file owns **everything about a
 * user that isn't credentials**: profile, addresses, and (later) preferences,
 * avatar, notification settings. It never hashes/verifies passwords — the
 * authenticated change-password flow lives in auth.ts's `changePassword`, and
 * this service must not grow that concern.
 *
 * Mirrors the layering used elsewhere: Server Actions (server/actions/
 * account.ts) → this service → Prisma. Every read/write is scoped to a
 * `userId` the caller has already authenticated (the action re-checks the
 * session per the two-layer rule in AUTH.md#authorization-flow), so nothing
 * here can touch another customer's row.
 */

export type ProfileView = Pick<User, "id" | "name" | "email" | "emailVerified" | "createdAt">;

export async function getProfile(userId: string): Promise<ProfileView | null> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

export interface UpdateProfileInput {
  name?: string | null;
  email: string;
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<ProfileView> {
  const existing = await db.user.findUnique({ where: { id: userId } });
  if (!existing) throw new Error("Account not found.");

  const emailChanged = input.email !== existing.email;
  if (emailChanged) {
    const clash = await db.user.findUnique({ where: { email: input.email } });
    if (clash && clash.id !== userId) {
      throw new Error("That email address is already in use.");
    }
  }

  const user = await db.user.update({
    where: { id: userId },
    data: {
      name: input.name ?? null,
      email: input.email,
      // A changed email is no longer a verified one — reset the flag so the
      // tracked state stays honest. Verification isn't enforced today (see
      // AUTH.md#email-verification-flow), so this doesn't lock anyone out; a
      // re-verification trigger can be added here if that ever changes.
      ...(emailChanged ? { emailVerified: null } : {}),
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

export interface AddressInput {
  line1: string;
  line2?: string | null;
  city: string;
  region?: string | null;
  postalCode: string;
  country: string;
  phone?: string | null;
}

export async function listAddresses(userId: string): Promise<Address[]> {
  return db.address.findMany({ where: { userId }, orderBy: { id: "asc" } });
}

export async function createAddress(userId: string, input: AddressInput): Promise<Address> {
  return db.address.create({
    data: {
      userId,
      line1: input.line1,
      line2: input.line2 ?? null,
      city: input.city,
      region: input.region ?? null,
      postalCode: input.postalCode,
      country: input.country,
      phone: input.phone ?? null,
    },
  });
}

export async function updateAddress(
  addressId: string,
  userId: string,
  input: AddressInput,
): Promise<Address> {
  // Ownership is enforced in the WHERE clause: updateMany won't touch a row
  // that isn't this user's, and a 0 count means "not found or not yours" —
  // never surfaced as a distinct case (no ownership oracle), same posture as
  // the order repository's ownership-aware reads.
  const { count } = await db.address.updateMany({
    where: { id: addressId, userId },
    data: {
      line1: input.line1,
      line2: input.line2 ?? null,
      city: input.city,
      region: input.region ?? null,
      postalCode: input.postalCode,
      country: input.country,
      phone: input.phone ?? null,
    },
  });
  if (count === 0) throw new Error("Address not found.");

  const address = await db.address.findUnique({ where: { id: addressId } });
  if (!address) throw new Error("Address not found.");
  return address;
}

export async function deleteAddress(addressId: string, userId: string): Promise<void> {
  const { count } = await db.address.deleteMany({ where: { id: addressId, userId } });
  if (count === 0) throw new Error("Address not found.");
}
