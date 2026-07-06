import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/lib/db";

/**
 * Auth.js config. `session.strategy: "jwt"` is required by the Credentials
 * provider (no database-backed sessions with Credentials) — the adapter is
 * still wired up so future OAuth providers can use database sessions/account
 * linking. `user.role` is threaded through the JWT/session so `proxy.ts` and
 * Server Actions can check it (see API.md#auth). As of Next.js 16, `proxy.ts`
 * defaults to the Node.js runtime, so importing this (Prisma-backed) config
 * there is safe — no edge-runtime split needed. No login/register UI exists
 * yet — that's Phase 2.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
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

        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
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
