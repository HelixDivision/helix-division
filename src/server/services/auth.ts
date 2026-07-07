import crypto from "node:crypto";

import bcrypt from "bcryptjs";

import type { VerificationPurpose } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { authAuditService } from "@/server/services/auth-audit";
import { notificationService } from "@/server/services/notifications";
import { rateLimiter } from "@/server/services/rate-limit";

/**
 * Authentication orchestration — mirrors server/services/orders.ts's
 * pattern (compose Prisma + the notification/audit/rate-limit services,
 * nothing above this layer touches `db` for auth concerns). `lib/auth.ts`'s
 * Credentials `authorize()` calls `verifyCredentials` here rather than
 * querying Prisma inline, keeping the "Server Actions/Auth.js callbacks →
 * services → Prisma" layering consistent with the rest of the app.
 *
 * Scope boundary: this file owns authentication only (register, verify
 * credentials, password reset, email verification, audit). Profile,
 * preferences, avatar, and notification-settings logic belongs to a future
 * `server/services/user.ts`, reserved for Phase 8 (Customer Accounts) — see
 * AUTH.md and PROJECT_CONTEXT.md. Don't grow this file into that.
 */

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Issues a token for `identifier` (the user's email) + `purpose`, storing
 * only its sha256 hash — the raw token exists solely in the emailed/logged
 * link. Deletes any prior unconsumed tokens of the same identifier+purpose
 * first, so a user can't accumulate stale links.
 */
async function issueToken(
  identifier: string,
  purpose: VerificationPurpose,
  ttlMs: number,
): Promise<string> {
  await db.verificationToken.deleteMany({ where: { identifier, purpose } });
  const rawToken = crypto.randomBytes(32).toString("hex");
  await db.verificationToken.create({
    data: {
      identifier,
      token: hashToken(rawToken),
      purpose,
      expires: new Date(Date.now() + ttlMs),
    },
  });
  return rawToken;
}

/** Single-use: the matching row is deleted whether or not it's expired. Returns the identifier (email) on success, `null` otherwise. */
async function consumeToken(
  rawToken: string,
  purpose: VerificationPurpose,
): Promise<string | null> {
  const token = hashToken(rawToken);
  const record = await db.verificationToken.findFirst({ where: { token, purpose } });
  if (!record) return null;

  await db.verificationToken.deleteMany({
    where: { identifier: record.identifier, token, purpose },
  });
  if (record.expires < new Date()) return null;

  return record.identifier;
}

export interface RegisterUserInput {
  name?: string;
  email: string;
  password: string;
  researchAcknowledged: boolean;
}

export async function registerUser(
  input: RegisterUserInput,
): Promise<{ id: string; email: string }> {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await db.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      // Same compliance requirement checkout enforces via
      // Order.researchAcknowledged — not skippable.
      researchAcknowledgedAt: new Date(),
    },
  });

  const rawToken = await issueToken(user.email, "EMAIL_VERIFICATION", EMAIL_VERIFICATION_TTL_MS);
  await notificationService.sendEmailVerification({
    email: user.email,
    url: `${env.NEXT_PUBLIC_SITE_URL}/verify-email/${rawToken}`,
  });

  authAuditService.log("registration", { email: user.email, userId: user.id });

  return { id: user.id, email: user.email };
}

export interface VerifiedUser {
  id: string;
  email: string;
  name: string | null;
  role: "CUSTOMER" | "ADMIN";
}

/** Used by lib/auth.ts's Credentials `authorize()`. Returns `null` on any failure — the caller logs `login_failure`, since there's no user to attach the log to here. */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<VerifiedUser | null> {
  const { allowed } = await rateLimiter.check(`login:${email}`);
  if (!allowed) return null;

  const user = await db.user.findUnique({ where: { email } });
  if (!user?.passwordHash) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/** Always no-ops silently if the email doesn't exist — anti-enumeration, matching checkout's "don't reveal what we know" posture. */
export async function requestPasswordReset(email: string): Promise<void> {
  authAuditService.log("password_reset_requested", { email });

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return;

  const rawToken = await issueToken(email, "PASSWORD_RESET", PASSWORD_RESET_TTL_MS);
  await notificationService.sendPasswordReset({
    email,
    url: `${env.NEXT_PUBLIC_SITE_URL}/reset-password/${rawToken}`,
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const email = await consumeToken(token, "PASSWORD_RESET");
  if (!email) {
    throw new Error("This password reset link is invalid or has expired.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.user.update({ where: { email }, data: { passwordHash } });

  authAuditService.log("password_reset_completed", { email });
}

/**
 * Authenticated "change password" (Phase 8, Account Settings) — distinct from
 * the token-based forgot/reset flow above, but kept here because all password
 * hashing/verification lives in this file; `server/services/user.ts` owns
 * everything *except* credentials (see AUTH.md#auth-vs-future-user-service).
 * The caller (server/actions/account.ts) is responsible for confirming the
 * session belongs to `userId` before calling this.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  // Same rule as every other auth entry point (see PROJECT_CONTEXT.md §5):
  // this verifies a password, so it's an online-guessing surface — a real
  // limiter must be able to guard it without a new call site being added.
  const { allowed } = await rateLimiter.check(`change-password:${userId}`);
  if (!allowed) {
    throw new Error("Too many attempts. Please try again later.");
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) {
    throw new Error("This account has no password set.");
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error("Your current password is incorrect.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });

  authAuditService.log("password_changed", { email: user.email, userId });
}

export async function verifyEmail(token: string): Promise<void> {
  const email = await consumeToken(token, "EMAIL_VERIFICATION");
  if (!email) {
    throw new Error("This verification link is invalid or has expired.");
  }

  await db.user.update({ where: { email }, data: { emailVerified: new Date() } });

  authAuditService.log("email_verified", { email });
}
