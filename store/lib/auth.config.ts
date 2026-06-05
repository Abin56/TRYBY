import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { UserRole, AdminRole } from "@prisma/client";

// Edge-safe auth config — NO Prisma, NO bcrypt, NO Node-only imports.
// Used by middleware.ts for fast session checks on the Edge.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Required so our custom signIn() callback can handle account linking
      // when the same email already exists as a credentials account.
      // Without this flag, NextAuth throws OAuthAccountNotLinked before our
      // callback runs and the user is permanently blocked from Google sign-in.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updatePayload }) {
      if (user) {
        // Initial sign-in — embed role from the authorize() return value.
        token.id          = user.id;
        token.role        = (user as { role?: UserRole }).role ?? UserRole.CUSTOMER;
        token.adminRole   = (user as { adminRole?: string }).adminRole ?? null;
        token.permissions = (user as { permissions?: string[] }).permissions ?? [];
        token.name        = user.name;
        token.image       = user.image;
      }

      // Session update trigger — accept fresh values pushed by the caller via
      // useSession().update({ adminRole, permissions }).
      if (trigger === "update" && token.id && updatePayload) {
        const payload = updatePayload as { adminRole?: string | null; permissions?: string[] };
        if (payload.adminRole   !== undefined) token.adminRole   = payload.adminRole;
        if (payload.permissions !== undefined) token.permissions = payload.permissions;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id          = token.id as string;
        session.user.role        = token.role as UserRole;
        session.user.adminRole   = (token.adminRole as AdminRole | null) ?? null;
        session.user.permissions = (token.permissions as string[]) ?? [];
        session.user.name        = token.name as string | null;
        session.user.image       = token.picture as string | null;
      }
      return session;
    },
    // Don't block at the authorized() level — our middleware handles
    // route-specific guards explicitly. Returning true here allows all
    // requests through; the middleware function below does the real checks.
    authorized() {
      return true;
    },
  },
} satisfies NextAuthConfig;
