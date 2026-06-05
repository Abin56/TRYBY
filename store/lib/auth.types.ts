import { UserRole, AdminRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id:          string;
      role:        UserRole;
      adminRole:   AdminRole | null;
      permissions: string[];
    } & DefaultSession["user"];
  }

  interface JWT {
    id:          string;
    role:        UserRole;
    adminRole:   string | null;
    permissions: string[];
  }
}
