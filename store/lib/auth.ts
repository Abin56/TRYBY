import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { authConfig } from "./auth.config";
import { checkAccountLock, recordFailedLogin, recordSuccessfulLogin } from "./login-protection";
import { sendWelcomeEmail } from "./email";

// Full auth config — Node runtime only (API routes, server components).
// Extends the edge-safe config with Prisma adapter + Credentials provider.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),

  events: {
    // Send welcome email on first sign-in via any provider
    async createUser({ user }) {
      if (user.email && user.name) {
        sendWelcomeEmail(user.email, { name: user.name }).catch(() => null);
      }
    },
  },

  callbacks: {
    ...authConfig.callbacks,

    // Re-fetch adminRole + permissions from DB on every JWT rotation so
    // role changes take effect without waiting for the token to expire.
    async jwt({ token, user, trigger, account, session: updatePayload }) {
      // Let the base config handle initial sign-in embedding and update triggers.
      const base = await authConfig.callbacks!.jwt!({ token, user, trigger, account, profile: undefined, session: updatePayload });

      // After initial sign-in there is nothing more to do.
      if (user) return base;

      // On every subsequent call (session refresh / update) re-query the DB
      // for ADMIN users so that role / permission changes are immediately live.
      if (base.id && base.role === "ADMIN") {
        try {
          const admin = await prisma.adminProfile.findUnique({
            where:  { userId: base.id as string },
            select: { adminRole: true, permissions: true, isDisabled: true },
          });
          if (admin) {
            if (admin.isDisabled) {
              // Disabled admin — invalidate the token by clearing identifying fields.
              base.role      = undefined;
              base.adminRole = null;
            } else {
              base.adminRole   = admin.adminRole;
              base.permissions = admin.permissions;
            }
          }
        } catch {
          // DB unavailable — keep existing token values.
        }
      }

      return base;
    },

    // Google OAuth account linking — prevent duplicate users.
    // If a user signs in with Google and their email already exists as a
    // credentials account, link the Google account to the existing user
    // instead of creating a new one.
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({
          where:   { email: user.email },
          include: { accounts: { where: { provider: "google" } } },
        });

        if (existing) {
          // User exists with this email. If Google is not yet linked, link it now.
          // Use upsert on the composite unique (provider, providerAccountId) so
          // a race between two simultaneous first-time Google sign-ins is safe.
          if (existing.accounts.length === 0) {
            await prisma.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider:          account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
              update: {
                access_token:  account.access_token,
                refresh_token: account.refresh_token,
                expires_at:    account.expires_at,
                id_token:      account.id_token,
              },
              create: {
                userId:            existing.id,
                type:              account.type,
                provider:          account.provider,
                providerAccountId: account.providerAccountId,
                access_token:      account.access_token,
                refresh_token:     account.refresh_token,
                expires_at:        account.expires_at,
                token_type:        account.token_type,
                scope:             account.scope,
                id_token:          account.id_token,
              },
            });

            // Update profile image if not set yet
            if (!existing.image && profile?.picture) {
              await prisma.user.update({
                where: { id: existing.id },
                data:  { image: profile.picture as string },
              }).catch(() => null);
            }
          }
          // Already linked or just linked — allow sign-in.
          return true;
        }
        // No existing user — NextAuth will create a new one via PrismaAdapter.
        // The new user gets UserRole.CUSTOMER by default (schema default).
      }
      return true; // allow credentials and all other providers
    },
  },

  providers: [
    ...authConfig.providers,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email    = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);
        const ip: string | null = null; // IP not available in NextAuth authorize context

        // Account lockout check
        const lockedUntil = await checkAccountLock(email);
        if (lockedUntil) return null; // silently reject — client shows generic error

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            accounts:     { where: { provider: "credentials" } },
            adminProfile: { select: { id: true, adminRole: true, permissions: true, isDisabled: true, passwordHash: true } },
          },
        });

        if (!user || !user.isActive) {
          await recordFailedLogin(email, ip, "user_not_found");
          return null;
        }

        // Admin login via AdminProfile.passwordHash
        if (user.role === UserRole.ADMIN && user.adminProfile) {
          if (user.adminProfile.isDisabled) return null;
          if (!user.adminProfile.passwordHash) return null;

          const valid = await bcrypt.compare(password, user.adminProfile.passwordHash);
          if (!valid) {
            await recordFailedLogin(email, ip, "invalid_password");
            return null;
          }

          await Promise.all([
            prisma.adminProfile.update({
              where: { id: user.adminProfile.id },
              data:  { lastLoginAt: new Date() },
            }).catch(() => null),
            recordSuccessfulLogin(email, ip),
          ]);

          return {
            id:          user.id,
            email:       user.email,
            name:        user.name,
            image:       user.image,
            role:        user.role,
            adminRole:   user.adminProfile.adminRole,
            permissions: user.adminProfile.permissions,
          };
        }

        // Customer/Supplier login via Account.access_token
        const credAccount = user.accounts[0];
        if (!credAccount?.access_token) {
          await recordFailedLogin(email, ip, "no_credentials_account");
          return null;
        }

        const valid = await bcrypt.compare(password, credAccount.access_token);
        if (!valid) {
          await recordFailedLogin(email, ip, "invalid_password");
          return null;
        }

        await recordSuccessfulLogin(email, ip);

        return {
          id:    user.id,
          email: user.email,
          name:  user.name,
          image: user.image,
          role:  user.role,
        };
      },
    }),
  ],
});
