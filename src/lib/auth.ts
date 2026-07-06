import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/lib/db";
import { verifyCredentials } from "@/server/services/auth";
import { authAuditService } from "@/server/services/auth-audit";

/**
 * Auth.js config. `session.strategy: "jwt"` is required by the Credentials
 * provider (no database-backed sessions with Credentials) — the adapter is
 * still wired up so future OAuth providers can use database sessions/account
 * linking (see the `providers` array below for where one would go). As of
 * Next.js 16, `proxy.ts` defaults to the Node.js runtime, so importing this
 * (Prisma-backed) config there is safe — no edge-runtime split needed.
 *
 * Session/cookie settings are explicit rather than left to Auth.js's
 * unstated defaults — see AUTH.md#session-lifecycle for the full writeup.
 * `maxAge`/`updateAge` implement a 30-day session with a rolling 24-hour
 * refresh (the session is re-issued on activity older than `updateAge`,
 * so an active user's session keeps extending; an inactive one still
 * expires at `maxAge`). Cookie options are the same values Auth.js already
 * defaults to — set explicitly here because session security shouldn't rely
 * on "trust the framework's defaults" for something this sensitive, and so
 * this block is the one place to look for the whole config.
 *
 * A future "Remember Me" option would scope to: a login-form checkbox, a
 * flag threaded through `authorize()`/the `jwt` callback, and a conditional
 * `maxAge` — no wider refactor, because session config already lives in
 * exactly this one place.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // rolling refresh: re-issue if older than 24h
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const user = await verifyCredentials(email, password);
        if (!user) {
          authAuditService.log("login_failure", { email });
          return null;
        }

        return user;
      },
    }),
    // Add an OAuth provider here later (e.g. Google({ clientId, clientSecret }))
    // — a config + .env addition, not a rework. See MFA/OAuth notes in AUTH.md.
  ],
  events: {
    async signIn({ user }) {
      authAuditService.log("login_success", { email: user.email ?? undefined, userId: user.id });
    },
    async signOut(message) {
      const email = "token" in message ? (message.token?.email ?? undefined) : undefined;
      authAuditService.log("logout", { email });
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "CUSTOMER" | "ADMIN";
      }
      return session;
    },
  },
});
